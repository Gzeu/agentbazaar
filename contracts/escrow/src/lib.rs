#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone)]
#[type_abi]
pub enum TaskStatus {
    Pending,
    Completed,
    Refunded,
    Disputed,
}

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
#[type_abi]
pub struct TaskRecord<M: ManagedTypeApi> {
    pub buyer: ManagedAddress<M>,
    pub provider: ManagedAddress<M>,
    pub service_id: ManagedBuffer<M>,
    pub amount: BigUint<M>,
    pub status: TaskStatus,
    pub payload_hash: ManagedBuffer<M>,
    pub proof_hash: ManagedBuffer<M>,
    pub created_at: u64,
    pub completed_at: u64,
}

pub const DISPUTE_WINDOW: u64 = 3600;
pub const TASK_TIMEOUT: u64 = 300;

#[multiversx_sc::contract]
pub trait EscrowContract {
    #[init]
    fn init(&self, registry_address: ManagedAddress, reputation_address: ManagedAddress) {
        self.registry_address().set(&registry_address);
        self.reputation_address().set(&reputation_address);
        self.owner().set(self.blockchain().get_caller());
    }

    #[upgrade]
    fn upgrade(&self) {}

    #[storage_mapper("tasks")]
    fn tasks(&self) -> MapMapper<ManagedBuffer, TaskRecord<Self::Api>>;

    #[storage_mapper("registryAddress")]
    fn registry_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("reputationAddress")]
    fn reputation_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[event("taskCreated")]
    fn emit_task_created(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] buyer: &ManagedAddress,
        #[indexed] provider: &ManagedAddress,
    );

    #[event("taskCompleted")]
    fn emit_task_completed(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
        proof_hash: &ManagedBuffer,
    );

    #[event("taskRefunded")]
    fn emit_task_refunded(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] buyer: &ManagedAddress,
    );

    #[event("disputeOpened")]
    fn emit_dispute_opened(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] opener: &ManagedAddress,
        reason: &ManagedBuffer,
    );

    #[event("disputeResolved")]
    fn emit_dispute_resolved(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] winner: &ManagedAddress,
    );

    #[payable("EGLD")]
    #[endpoint(createTask)]
    fn create_task(
        &self,
        task_id: ManagedBuffer,
        service_id: ManagedBuffer,
        provider: ManagedAddress,
        payload_hash: ManagedBuffer,
    ) {
        require!(!self.tasks().contains_key(&task_id), "Task ID already exists");
        let payment = self.call_value().egld().clone_value();
        require!(payment > BigUint::zero(), "Must attach EGLD payment");
        let caller = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp_seconds();
        let record = TaskRecord {
            buyer: caller.clone(),
            provider: provider.clone(),
            service_id: service_id.clone(),
            amount: payment.clone(),
            status: TaskStatus::Pending,
            payload_hash: payload_hash.clone(),
            proof_hash: ManagedBuffer::new(),
            created_at: now,
            completed_at: 0u64,
        };
        self.tasks().insert(task_id.clone(), record);
        self.emit_task_created(&task_id, &caller, &provider);
    }

    #[endpoint(releaseEscrow)]
    fn release_escrow(&self, task_id: ManagedBuffer, proof_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.provider == caller, "Not task provider");
        require!(record.status == TaskStatus::Pending, "Task not in Pending state");
        let now = self.blockchain().get_block_timestamp_seconds();
        record.status = TaskStatus::Completed;
        record.proof_hash = proof_hash.clone();
        record.completed_at = now;
        let amount = record.amount.clone();
        self.tasks().insert(task_id.clone(), record);
        self.send().direct_egld(&caller, &amount);
        self.emit_task_completed(&task_id, &caller, &proof_hash);
    }

    #[endpoint(refundTask)]
    fn refund_task(&self, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.buyer == caller, "Not task buyer");
        require!(record.status == TaskStatus::Pending, "Task not in Pending state");
        let now = self.blockchain().get_block_timestamp_seconds();
        require!(now >= record.created_at + TASK_TIMEOUT, "Task timeout not reached yet");
        let amount = record.amount.clone();
        record.status = TaskStatus::Refunded;
        self.tasks().insert(task_id.clone(), record);
        self.send().direct_egld(&caller, &amount);
        self.emit_task_refunded(&task_id, &caller);
    }

    #[endpoint(openDispute)]
    fn open_dispute(&self, task_id: ManagedBuffer, reason: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(
            record.buyer == caller || record.provider == caller,
            "Not task participant"
        );
        require!(
            record.status == TaskStatus::Pending || record.status == TaskStatus::Completed,
            "Cannot dispute in current state"
        );
        let now = self.blockchain().get_block_timestamp_seconds();
        if record.status == TaskStatus::Completed {
            require!(now <= record.completed_at + DISPUTE_WINDOW, "Dispute window expired");
        }
        record.status = TaskStatus::Disputed;
        self.tasks().insert(task_id.clone(), record);
        self.emit_dispute_opened(&task_id, &caller, &reason);
    }

    #[endpoint(resolveDispute)]
    fn resolve_dispute(&self, task_id: ManagedBuffer, winner: ManagedAddress) {
        require!(self.blockchain().get_caller() == self.owner().get(), "Not owner");
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.status == TaskStatus::Disputed, "Task not disputed");
        let amount = record.amount.clone();
        record.status = TaskStatus::Completed;
        self.tasks().insert(task_id.clone(), record);
        self.send().direct_egld(&winner, &amount);
        self.emit_dispute_resolved(&task_id, &winner);
    }

    #[view(getTask)]
    fn get_task(&self, task_id: ManagedBuffer) -> OptionalValue<TaskRecord<Self::Api>> {
        match self.tasks().get(&task_id) {
            Some(r) => OptionalValue::Some(r),
            None => OptionalValue::None,
        }
    }
}
