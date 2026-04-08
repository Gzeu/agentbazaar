#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// On-chain reputation record for a provider.
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct ReputationRecord<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub score: u64,
    pub completed_tasks: u64,
    pub failed_tasks: u64,
    pub disputed_tasks: u64,
    pub slash_count: u64,
    pub total_latency_ms: u64,
    pub updated_at: u64,
}

impl<M: ManagedTypeApi> ReputationRecord<M> {
    fn new(address: ManagedAddress<M>) -> Self {
        ReputationRecord {
            address,
            score: 100,
            completed_tasks: 0,
            failed_tasks: 0,
            disputed_tasks: 0,
            slash_count: 0,
            total_latency_ms: 0,
            updated_at: 0,
        }
    }

    fn recompute_score(&mut self) {
        let total = self.completed_tasks + self.failed_tasks + self.disputed_tasks;
        if total == 0 {
            self.score = 100;
            return;
        }
        let success_rate = self.completed_tasks * 100 / total;
        let failure_penalty = self.failed_tasks * 2;
        let dispute_penalty = self.disputed_tasks * 4;
        let slash_penalty = self.slash_count * 10;

        let raw = success_rate
            .saturating_sub(failure_penalty)
            .saturating_sub(dispute_penalty)
            .saturating_sub(slash_penalty);

        self.score = raw.min(100);
    }
}

#[multiversx_sc::contract]
pub trait Reputation {
    #[init]
    fn init(&self) {}

    // ─── Write endpoints ────────────────────────────────────────────────────

    /// Provider submits proof of task completion with latency.
    #[endpoint(submitCompletionProof)]
    fn submit_completion_proof(
        &self,
        task_id: ManagedBuffer,
        proof_hash: ManagedBuffer,
        latency_ms: u64,
    ) {
        require!(!task_id.is_empty(), "Empty task ID");
        require!(!proof_hash.is_empty(), "Empty proof hash");
        require!(!self.completed_proofs().contains(&task_id), "Proof already submitted");

        let caller = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp();

        self.completed_proofs().insert(task_id.clone());

        let mut record = self
            .reputation_records()
            .get(&caller)
            .unwrap_or_else(|| ReputationRecord::new(caller.clone()));

        record.completed_tasks += 1;
        record.total_latency_ms += latency_ms;
        record.updated_at = now;
        record.recompute_score();

        self.reputation_records().insert(caller.clone(), record);

        self.reputation_updated_event(&caller, &task_id, &proof_hash);
    }

    /// Owner slashes a provider for misbehavior.
    #[only_owner]
    #[endpoint(slashProvider)]
    fn slash_provider(
        &self,
        provider: ManagedAddress,
        task_id: ManagedBuffer,
        reason: ManagedBuffer,
    ) {
        let now = self.blockchain().get_block_timestamp();

        let mut record = self
            .reputation_records()
            .get(&provider)
            .unwrap_or_else(|| ReputationRecord::new(provider.clone()));

        record.slash_count += 1;
        record.disputed_tasks += 1;
        record.updated_at = now;
        record.recompute_score();

        self.reputation_records().insert(provider.clone(), record);

        self.provider_slashed_event(&provider, &task_id, &reason);
    }

    /// Record a failed task against a provider.
    #[only_owner]
    #[endpoint(recordFailedTask)]
    fn record_failed_task(&self, provider: ManagedAddress, task_id: ManagedBuffer) {
        let now = self.blockchain().get_block_timestamp();

        let mut record = self
            .reputation_records()
            .get(&provider)
            .unwrap_or_else(|| ReputationRecord::new(provider.clone()));

        record.failed_tasks += 1;
        record.updated_at = now;
        record.recompute_score();

        self.reputation_records().insert(provider.clone(), record);
        self.reputation_updated_event(&provider, &task_id, &ManagedBuffer::from(b"failed"));
    }

    // ─── View endpoints ─────────────────────────────────────────────────────

    #[view(getReputation)]
    fn get_reputation(
        &self,
        provider: ManagedAddress,
    ) -> OptionalValue<ReputationRecord<Self::Api>> {
        match self.reputation_records().get(&provider) {
            Some(r) => OptionalValue::Some(r),
            None => OptionalValue::None,
        }
    }

    #[view(getScore)]
    fn get_score(&self, provider: ManagedAddress) -> u64 {
        self.reputation_records()
            .get(&provider)
            .map(|r| r.score)
            .unwrap_or(100)
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    #[storage_mapper("reputation_records")]
    fn reputation_records(
        &self,
    ) -> MapMapper<ManagedAddress, ReputationRecord<Self::Api>>;

    #[storage_mapper("completed_proofs")]
    fn completed_proofs(&self) -> UnorderedSetMapper<ManagedBuffer>;

    // ─── Events ──────────────────────────────────────────────────────────────

    #[event("ReputationUpdated")]
    fn reputation_updated_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
        proof_hash: &ManagedBuffer,
    );

    #[event("ProviderSlashed")]
    fn provider_slashed_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
        reason: &ManagedBuffer,
    );
}
