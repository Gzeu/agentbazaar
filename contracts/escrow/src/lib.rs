#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// Task lifecycle status.
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone, PartialEq)]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Refunded,
    Disputed,
}

/// On-chain task record stored in the Escrow.
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct TaskRecord<M: ManagedTypeApi> {
    pub service_id: ManagedBuffer<M>,
    pub buyer: ManagedAddress<M>,
    pub provider: ManagedAddress<M>,
    pub amount: BigUint<M>,
    pub status: TaskStatus,
    pub payload_hash: ManagedBuffer<M>,
    pub proof_hash: ManagedBuffer<M>,
    pub created_at: u64,
    pub timeout_at: u64,
    pub completed_at: u64,
}

#[multiversx_sc::contract]
pub trait Escrow {
    #[init]
    fn init(&self, task_timeout_seconds: u64, marketplace_fee_bps: u64) {
        self.task_timeout_seconds().set(task_timeout_seconds);
        self.marketplace_fee_bps().set(marketplace_fee_bps);
    }

    // ─── Write endpoints ────────────────────────────────────────────────────

    /// Create a task and lock EGLD in escrow.
    #[payable("EGLD")]
    #[endpoint(createTask)]
    fn create_task(
        &self,
        task_id: ManagedBuffer,
        service_id: ManagedBuffer,
        provider: ManagedAddress,
        payload_hash: ManagedBuffer,
    ) {
        let amount = self.call_value().egld_value().clone_value();
        require!(amount > BigUint::zero(), "Must send EGLD to escrow");
        require!(!task_id.is_empty(), "Empty task ID");
        require!(!self.tasks().contains_key(&task_id), "Task ID already exists");

        let caller = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp();
        let timeout = now + self.task_timeout_seconds().get();

        let record = TaskRecord {
            service_id,
            buyer: caller.clone(),
            provider: provider.clone(),
            amount,
            status: TaskStatus::Pending,
            payload_hash,
            proof_hash: ManagedBuffer::new(),
            created_at: now,
            timeout_at: timeout,
            completed_at: 0,
        };

        self.tasks().insert(task_id.clone(), record);

        self.task_created_event(&task_id, &caller, &provider);
    }

    /// Provider submits proof and releases escrow to themselves.
    #[endpoint(releaseEscrow)]
    fn release_escrow(&self, task_id: ManagedBuffer, proof_hash: ManagedBuffer) {
        require!(self.tasks().contains_key(&task_id), "Task not found");
        let mut record = self.tasks().get(&task_id).unwrap();
        require!(record.provider == self.blockchain().get_caller(), "Not the provider");
        require!(record.status == TaskStatus::Pending || record.status == TaskStatus::Running, "Task not active");
        require!(!proof_hash.is_empty(), "Empty proof hash");

        let fee_bps = self.marketplace_fee_bps().get();
        let fee = &record.amount * fee_bps / 10_000u64;
        let payout = &record.amount - &fee;

        record.status = TaskStatus::Completed;
        record.proof_hash = proof_hash;
        record.completed_at = self.blockchain().get_block_timestamp();
        self.tasks().insert(task_id.clone(), record.clone());

        if payout > BigUint::zero() {
            self.tx()
                .to(&record.provider)
                .egld(&payout)
                .transfer();
        }

        self.task_completed_event(&task_id, &record.provider, &record.proof_hash);
    }

    /// Buyer refunds after timeout expires.
    #[endpoint(refundTask)]
    fn refund_task(&self, task_id: ManagedBuffer) {
        require!(self.tasks().contains_key(&task_id), "Task not found");
        let mut record = self.tasks().get(&task_id).unwrap();
        require!(record.buyer == self.blockchain().get_caller(), "Not the buyer");
        require!(record.status == TaskStatus::Pending || record.status == TaskStatus::Running, "Task not active");
        require!(
            self.blockchain().get_block_timestamp() >= record.timeout_at,
            "Timeout not reached yet"
        );

        record.status = TaskStatus::Refunded;
        self.tasks().insert(task_id.clone(), record.clone());

        self.tx()
            .to(&record.buyer)
            .egld(&record.amount)
            .transfer();

        self.task_refunded_event(&task_id, &record.buyer);
    }

    /// Buyer opens dispute before timeout.
    #[endpoint(openDispute)]
    fn open_dispute(&self, task_id: ManagedBuffer, reason: ManagedBuffer) {
        require!(self.tasks().contains_key(&task_id), "Task not found");
        let mut record = self.tasks().get(&task_id).unwrap();
        require!(record.buyer == self.blockchain().get_caller(), "Not the buyer");
        require!(record.status == TaskStatus::Pending || record.status == TaskStatus::Running, "Task not active");

        record.status = TaskStatus::Disputed;
        self.tasks().insert(task_id.clone(), record.clone());

        self.dispute_opened_event(&task_id, &record.buyer, &reason);
    }

    /// Owner resolves dispute — sends to winner.
    #[only_owner]
    #[endpoint(resolveDispute)]
    fn resolve_dispute(&self, task_id: ManagedBuffer, in_favor_of_buyer: bool) {
        require!(self.tasks().contains_key(&task_id), "Task not found");
        let mut record = self.tasks().get(&task_id).unwrap();
        require!(record.status == TaskStatus::Disputed, "Task not disputed");

        let winner = if in_favor_of_buyer {
            record.buyer.clone()
        } else {
            record.provider.clone()
        };

        record.status = if in_favor_of_buyer { TaskStatus::Refunded } else { TaskStatus::Completed };
        self.tasks().insert(task_id.clone(), record.clone());

        self.tx().to(&winner).egld(&record.amount).transfer();

        self.dispute_resolved_event(&task_id, &winner, in_favor_of_buyer);
    }

    // ─── View endpoints ─────────────────────────────────────────────────────

    #[view(getTask)]
    fn get_task(&self, task_id: ManagedBuffer) -> OptionalValue<TaskRecord<Self::Api>> {
        match self.tasks().get(&task_id) {
            Some(record) => OptionalValue::Some(record),
            None => OptionalValue::None,
        }
    }

    #[view(getTaskTimeoutSeconds)]
    fn get_task_timeout_seconds(&self) -> u64 {
        self.task_timeout_seconds().get()
    }

    #[view(getMarketplaceFeeBps)]
    fn get_marketplace_fee_bps(&self) -> u64 {
        self.marketplace_fee_bps().get()
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    #[storage_mapper("tasks")]
    fn tasks(&self) -> MapMapper<ManagedBuffer, TaskRecord<Self::Api>>;

    #[storage_mapper("task_timeout_seconds")]
    fn task_timeout_seconds(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("marketplace_fee_bps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u64>;

    // ─── Events ──────────────────────────────────────────────────────────────

    #[event("TaskCreated")]
    fn task_created_event(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] buyer: &ManagedAddress,
        #[indexed] provider: &ManagedAddress,
    );

    #[event("TaskCompleted")]
    fn task_completed_event(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
        proof_hash: &ManagedBuffer,
    );

    #[event("TaskRefunded")]
    fn task_refunded_event(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] buyer: &ManagedAddress,
    );

    #[event("DisputeOpened")]
    fn dispute_opened_event(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] buyer: &ManagedAddress,
        reason: &ManagedBuffer,
    );

    #[event("DisputeResolved")]
    fn dispute_resolved_event(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] winner: &ManagedAddress,
        in_favor_of_buyer: bool,
    );
}
