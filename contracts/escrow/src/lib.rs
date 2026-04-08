#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub mod events;
pub mod storage;
pub mod views;

use storage::{TaskRecord, TaskStatus};

/// Dispute window: 1 hour in seconds.
pub const DISPUTE_WINDOW: u64 = 3600;
/// Task timeout: 5 minutes.
pub const TASK_TIMEOUT: u64 = 300;

#[multiversx_sc::contract]
pub trait EscrowContract:
    storage::StorageModule
    + views::ViewsModule
    + events::EventsModule
{
    #[init]
    fn init(&self, registry_address: ManagedAddress, reputation_address: ManagedAddress) {
        self.registry_address().set(&registry_address);
        self.reputation_address().set(&reputation_address);
        self.owner().set(self.blockchain().get_caller());
    }

    #[upgrade]
    fn upgrade(&self) {}

    // ----------------------------------------------------------------
    // Consumer endpoints
    // ----------------------------------------------------------------

    /// Lock EGLD in escrow for a task. Emits TaskCreated.
    #[payable("EGLD")]
    #[endpoint(createTask)]
    fn create_task(
        &self,
        task_id: ManagedBuffer,
        service_id: ManagedBuffer,
        provider: ManagedAddress,
        payload_hash: ManagedBuffer,
    ) {
        require!(
            !self.tasks().contains_key(&task_id),
            "Task ID already exists"
        );
        let payment = self.call_value().egld_value().clone_value();
        require!(payment > BigUint::zero(), "Must attach EGLD payment");

        let caller = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp();

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

        self.emit_task_created(
            &task_id,
            &caller,
            &provider,
            &service_id,
            &payment,
        );
    }

    // ----------------------------------------------------------------
    // Provider endpoints
    // ----------------------------------------------------------------

    /// Provider submits proof and releases escrow to themselves.
    #[endpoint(releaseEscrow)]
    fn release_escrow(&self, task_id: ManagedBuffer, proof_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));

        require!(record.provider == caller, "Not task provider");
        require!(
            record.status == TaskStatus::Pending,
            "Task not in Pending state"
        );

        let now = self.blockchain().get_block_timestamp();
        record.status = TaskStatus::Completed;
        record.proof_hash = proof_hash.clone();
        record.completed_at = now;

        let amount = record.amount.clone();
        self.tasks().insert(task_id.clone(), record);
        self.send().direct_egld(&caller, &amount);

        self.emit_task_completed(&task_id, &caller, &proof_hash);
    }

    // ----------------------------------------------------------------
    // Consumer timeout refund
    // ----------------------------------------------------------------

    /// Consumer can claim refund if task timed out.
    #[endpoint(refundTask)]
    fn refund_task(&self, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));

        require!(record.buyer == caller, "Not task buyer");
        require!(
            record.status == TaskStatus::Pending,
            "Task not in Pending state"
        );

        let now = self.blockchain().get_block_timestamp();
        require!(
            now >= record.created_at + TASK_TIMEOUT,
            "Task timeout not reached yet"
        );

        let amount = record.amount.clone();
        record.status = TaskStatus::Refunded;
        self.tasks().insert(task_id.clone(), record);
        self.send().direct_egld(&caller, &amount);

        self.emit_task_refunded(&task_id, &caller);
    }

    // ----------------------------------------------------------------
    // Dispute
    // ----------------------------------------------------------------

    /// Open a dispute within the dispute window.
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

        let now = self.blockchain().get_block_timestamp();
        if record.status == TaskStatus::Completed {
            require!(
                now <= record.completed_at + DISPUTE_WINDOW,
                "Dispute window expired"
            );
        }

        record.status = TaskStatus::Disputed;
        self.tasks().insert(task_id.clone(), record);

        self.emit_dispute_opened(&task_id, &caller, &reason);
    }

    /// Owner resolves dispute: sends funds to winner.
    #[endpoint(resolveDispute)]
    fn resolve_dispute(
        &self,
        task_id: ManagedBuffer,
        winner: ManagedAddress,
    ) {
        let caller = self.blockchain().get_caller();
        require!(caller == self.owner().get(), "Not owner");

        let mut record = self.tasks().get(&task_id)
            .unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.status == TaskStatus::Disputed, "Task not disputed");

        let amount = record.amount.clone();
        record.status = TaskStatus::Completed;
        self.tasks().insert(task_id.clone(), record);
        self.send().direct_egld(&winner, &amount);

        self.emit_dispute_resolved(&task_id, &winner);
    }
}
