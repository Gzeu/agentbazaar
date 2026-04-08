#![no_std]

use multiversx_sc::imports::*;

/// AgentBazaar Escrow Contract
/// Handles task lifecycle: lock funds → execution → release/refund/dispute.
/// Integrates with Registry (task counter) and Reputation (proof anchoring).
#[multiversx_sc::contract]
pub trait EscrowContract {
    // ── Storage ──────────────────────────────────────────────────────────────

    #[storage_mapper("tasks")]
    fn tasks(&self) -> MapMapper<ManagedBuffer, TaskRecord<Self::Api>>;

    #[storage_mapper("task_count")]
    fn task_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("registry_address")]
    fn registry_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("reputation_address")]
    fn reputation_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("dispute_window_seconds")]
    fn dispute_window(&self) -> SingleValueMapper<u64>;

    // ── Init ─────────────────────────────────────────────────────────────────

    #[init]
    fn init(
        &self,
        registry_addr: ManagedAddress,
        reputation_addr: ManagedAddress,
        dispute_window_seconds: u64,
    ) {
        self.owner().set(&self.blockchain().get_caller());
        self.registry_address().set(registry_addr);
        self.reputation_address().set(reputation_addr);
        self.dispute_window().set(dispute_window_seconds);
        self.task_count().set(0u64);
    }

    // ── Submit Task ──────────────────────────────────────────────────────────

    /// Consumer locks EGLD for a task. Returns task_id.
    #[payable("EGLD")]
    #[endpoint(submitTask)]
    fn submit_task(
        &self,
        task_id: ManagedBuffer,
        service_id: ManagedBuffer,
        provider: ManagedAddress,
        deadline_timestamp: u64,
        payload_hash: ManagedBuffer, // keccak256 of off-chain payload
    ) {
        let budget = self.call_value().egld();
        require!(*budget > BigUint::zero(), "Budget must be > 0");
        require!(!task_id.is_empty(), "Task ID required");
        require!(!self.tasks().contains_key(&task_id), "Task ID already exists");

        let consumer = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp();
        require!(deadline_timestamp > now, "Deadline must be in future");

        let record = TaskRecord {
            task_id: task_id.clone(),
            service_id: service_id.clone(),
            consumer: consumer.clone(),
            provider: provider.clone(),
            budget: (*budget).clone(),
            deadline: deadline_timestamp,
            created_at: now,
            status: TaskStatus::Pending,
            proof_hash: ManagedBuffer::new(),
            completed_at: 0u64,
        };

        self.tasks().insert(task_id.clone(), record);
        let count = self.task_count().get();
        self.task_count().set(count + 1);

        self.task_submitted_event(&task_id, &service_id, &consumer, &provider, &*budget, deadline_timestamp);
    }

    // ── Submit Proof & Release ───────────────────────────────────────────────

    /// Provider submits execution proof. Funds released to provider.
    #[endpoint(submitProofAndRelease)]
    fn submit_proof_and_release(&self, task_id: ManagedBuffer, proof_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.provider == caller, "Only provider");
        require!(record.status == TaskStatus::Pending, "Task not pending");

        let now = self.blockchain().get_block_timestamp();
        require!(now <= record.deadline, "Task deadline passed");

        record.proof_hash = proof_hash.clone();
        record.status = TaskStatus::Completed;
        record.completed_at = now;
        self.tasks().insert(task_id.clone(), record.clone());

        // Release payment to provider
        self.tx().to(&record.provider).egld(&record.budget).transfer();

        // Notify registry
        self.tx()
            .to(self.registry_address().get())
            .typed(RegistryProxy)
            .increment_task_count(record.service_id.clone())
            .sync_call();

        self.task_completed_event(&task_id, &record.provider, &record.budget, &proof_hash, now);
    }

    // ── Refund (timeout) ─────────────────────────────────────────────────────

    /// Anyone can trigger refund after deadline passes with no proof.
    #[endpoint(refundExpired)]
    fn refund_expired(&self, task_id: ManagedBuffer) {
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.status == TaskStatus::Pending, "Task not pending");
        let now = self.blockchain().get_block_timestamp();
        require!(now > record.deadline, "Deadline not passed yet");

        record.status = TaskStatus::Refunded;
        self.tasks().insert(task_id.clone(), record.clone());

        self.tx().to(&record.consumer).egld(&record.budget).transfer();
        self.task_refunded_event(&task_id, &record.consumer, &record.budget);
    }

    // ── Dispute ──────────────────────────────────────────────────────────────

    /// Consumer opens dispute within dispute_window after completion.
    #[endpoint(openDispute)]
    fn open_dispute(&self, task_id: ManagedBuffer, reason_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.consumer == caller, "Only consumer");
        require!(record.status == TaskStatus::Completed, "Task not completed");

        let now = self.blockchain().get_block_timestamp();
        require!(
            now <= record.completed_at + self.dispute_window().get(),
            "Dispute window closed"
        );

        record.status = TaskStatus::Disputed;
        self.tasks().insert(task_id.clone(), record);
        self.dispute_opened_event(&task_id, &caller, &reason_hash);
    }

    // ── Resolve Dispute (owner/dao) ───────────────────────────────────────────

    #[endpoint(resolveDispute)]
    fn resolve_dispute(
        &self, task_id: ManagedBuffer,
        favor_consumer: bool,
    ) {
        require!(self.blockchain().get_caller() == self.owner().get(), "Only owner");
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.status == TaskStatus::Disputed, "Task not disputed");

        record.status = TaskStatus::Resolved;
        self.tasks().insert(task_id.clone(), record.clone());

        if favor_consumer {
            self.tx().to(&record.consumer).egld(&record.budget).transfer();
        } else {
            self.tx().to(&record.provider).egld(&record.budget).transfer();
        }
        self.dispute_resolved_event(&task_id, favor_consumer);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    #[view(getTask)]
    fn get_task(&self, task_id: ManagedBuffer) -> OptionalValue<TaskRecord<Self::Api>> {
        OptionalValue::from(self.tasks().get(&task_id))
    }

    #[view(getTaskCount)]
    fn get_task_count(&self) -> u64 {
        self.task_count().get()
    }

    // ── Events ────────────────────────────────────────────────────────────────

    #[event("taskSubmitted")]
    fn task_submitted_event(
        &self, #[indexed] task_id: &ManagedBuffer, #[indexed] service_id: &ManagedBuffer,
        #[indexed] consumer: &ManagedAddress, #[indexed] provider: &ManagedAddress,
        budget: &BigUint, deadline: u64,
    );

    #[event("taskCompleted")]
    fn task_completed_event(
        &self, #[indexed] task_id: &ManagedBuffer, #[indexed] provider: &ManagedAddress,
        amount: &BigUint, proof_hash: &ManagedBuffer, timestamp: u64,
    );

    #[event("taskRefunded")]
    fn task_refunded_event(
        &self, #[indexed] task_id: &ManagedBuffer,
        #[indexed] consumer: &ManagedAddress, amount: &BigUint,
    );

    #[event("disputeOpened")]
    fn dispute_opened_event(
        &self, #[indexed] task_id: &ManagedBuffer,
        #[indexed] consumer: &ManagedAddress, reason_hash: &ManagedBuffer,
    );

    #[event("disputeResolved")]
    fn dispute_resolved_event(&self, #[indexed] task_id: &ManagedBuffer, favor_consumer: bool);
}

// ── Types ──────────────────────────────────────────────────────────────────

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone, PartialEq)]
pub enum TaskStatus {
    Pending,
    Completed,
    Refunded,
    Disputed,
    Resolved,
}

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct TaskRecord<M: ManagedTypeApi> {
    pub task_id: ManagedBuffer<M>,
    pub service_id: ManagedBuffer<M>,
    pub consumer: ManagedAddress<M>,
    pub provider: ManagedAddress<M>,
    pub budget: BigUint<M>,
    pub deadline: u64,
    pub created_at: u64,
    pub status: TaskStatus,
    pub proof_hash: ManagedBuffer<M>,
    pub completed_at: u64,
}

// ── Cross-contract proxy ───────────────────────────────────────────────────

mod RegistryProxy {
    use multiversx_sc::proxy_imports::*;
    pub struct RegistryProxyMethods<Env, From, To, Gas>
    where Env: TxEnv, From: TxFrom<Env>, To: TxTo<Env>, Gas: TxGas<Env>
    { _env: PhantomData<Env>, _from: PhantomData<From>, _to: PhantomData<To>, _gas: PhantomData<Gas> }

    impl<Env, From, To, Gas> RegistryProxyMethods<Env, From, To, Gas>
    where Env: TxEnv, TxEnv::Api: VMHooks, From: TxFrom<Env>, To: TxTo<Env>, Gas: TxGas<Env>
    {
        pub fn increment_task_count(self, service_id: ManagedBuffer<Env::Api>) ->
            TxTypedCall<Env, From, To, NotPayable, Gas, ()>
        {
            self.wrapped_tx.raw_call("incrementTaskCount").argument(&service_id).original_result()
        }
    }
}
