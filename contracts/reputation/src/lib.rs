#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub mod events;
pub mod storage;
pub mod views;

use storage::ReputationRecord;

/// Decay factor numerator (applied per 30 days of inactivity): 95/100 = 5% decay.
pub const DECAY_FACTOR_NUM: u64 = 95;
pub const DECAY_FACTOR_DEN: u64 = 100;
pub const DECAY_PERIOD_SECONDS: u64 = 2_592_000; // 30 days

#[multiversx_sc::contract]
pub trait ReputationContract:
    storage::StorageModule
    + views::ViewsModule
    + events::EventsModule
{
    #[init]
    fn init(&self, escrow_address: ManagedAddress) {
        self.escrow_address().set(&escrow_address);
        self.owner().set(self.blockchain().get_caller());
    }

    #[upgrade]
    fn upgrade(&self) {}

    // ----------------------------------------------------------------
    // Escrow callback — called by Escrow contract after task completes
    // ----------------------------------------------------------------

    /// Submit a completion proof. Only callable by registered escrow contract.
    #[endpoint(submitCompletionProof)]
    fn submit_completion_proof(
        &self,
        task_id: ManagedBuffer,
        proof_hash: ManagedBuffer,
        latency_ms: u64,
    ) {
        let caller = self.blockchain().get_caller();
        require!(
            caller == self.escrow_address().get() || caller == self.owner().get(),
            "Unauthorized: only escrow or owner"
        );

        // Provider address extracted from task_id prefix convention or passed directly
        // Here we use caller-passed provider via task metadata (simplified).
        // In production: cross-contract call to Escrow to get task.provider.
        let provider = caller;
        let now = self.blockchain().get_block_timestamp();

        let mut record = self.reputation(&provider).get();
        record = self.apply_decay(record, now);
        record.completed_tasks += 1;
        record.total_latency_ms += latency_ms;
        record.last_proof_hash = proof_hash.clone();
        record.last_updated = now;
        record.score = self.compute_score(&record);

        self.reputation(&provider).set(&record);
        self.emit_reputation_updated(&provider, record.score, record.completed_tasks);
    }

    /// Record a task failure (callable by escrow or owner).
    #[endpoint(recordFailure)]
    fn record_failure(&self, provider: ManagedAddress, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        require!(
            caller == self.escrow_address().get() || caller == self.owner().get(),
            "Unauthorized"
        );

        let now = self.blockchain().get_block_timestamp();
        let mut record = self.reputation(&provider).get();
        record = self.apply_decay(record, now);
        record.failed_tasks += 1;
        record.last_updated = now;
        record.score = self.compute_score(&record);

        self.reputation(&provider).set(&record);
        self.emit_slash_event(&provider, &task_id, ManagedBuffer::from(b"failure"));
    }

    /// Slash a provider for dispute loss (owner only).
    #[endpoint(slashProvider)]
    fn slash_provider(
        &self,
        provider: ManagedAddress,
        task_id: ManagedBuffer,
        reason: ManagedBuffer,
    ) {
        let caller = self.blockchain().get_caller();
        require!(caller == self.owner().get(), "Not owner");

        let now = self.blockchain().get_block_timestamp();
        let mut record = self.reputation(&provider).get();
        record = self.apply_decay(record, now);
        record.disputed_tasks += 1;
        // Hard slash: subtract 10 points directly
        record.score = if record.score >= 10 { record.score - 10 } else { 0 };
        record.last_updated = now;

        self.reputation(&provider).set(&record);
        self.emit_slash_event(&provider, &task_id, reason);
    }

    // ----------------------------------------------------------------
    // Internal helpers
    // ----------------------------------------------------------------

    fn compute_score(&self, record: &ReputationRecord<Self::Api>) -> u64 {
        let total = record.completed_tasks + record.failed_tasks + record.disputed_tasks;
        if total == 0 {
            return 50; // neutral starting score
        }
        let success_rate_x100 = record.completed_tasks * 100 / total;
        let failure_penalty = record.failed_tasks * 2;
        let dispute_penalty = record.disputed_tasks * 4;
        let median_latency = if record.completed_tasks > 0 {
            record.total_latency_ms / record.completed_tasks
        } else {
            1000
        };
        let latency_bonus = if median_latency < 1000 { (1000 - median_latency) / 100 } else { 0 };
        let raw = success_rate_x100
            .saturating_sub(failure_penalty)
            .saturating_sub(dispute_penalty)
            + latency_bonus;
        raw.min(100)
    }

    fn apply_decay(
        &self,
        mut record: ReputationRecord<Self::Api>,
        now: u64,
    ) -> ReputationRecord<Self::Api> {
        if record.last_updated == 0 {
            return record;
        }
        let elapsed = now.saturating_sub(record.last_updated);
        let periods = elapsed / DECAY_PERIOD_SECONDS;
        for _ in 0..periods {
            record.score = record.score * DECAY_FACTOR_NUM / DECAY_FACTOR_DEN;
        }
        record
    }
}
