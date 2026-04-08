#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// ─── Reputation Record ───────────────────────────────────────────────────────
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, ManagedVecItem, Clone)]
pub struct ReputationRecord<M: ManagedTypeApi> {
    pub provider: ManagedAddress<M>,
    pub total_tasks: u64,
    pub successful_tasks: u64,
    pub failed_tasks: u64,
    pub disputed_tasks: u64,
    pub slash_count: u64,
    pub composite_score: u64,   // 0-10000 (basis points, 10000 = 100.00%)
    pub last_updated: u64,
}

/// ─── Reputation Contract ─────────────────────────────────────────────────────
/// Score formula (composite):
///   completion_rate = successful / total  (weight 50%)
///   dispute_rate    = 1 - disputed / total (weight 30%)
///   decay_factor    = 0.98 ^ weeks_since_last_task (weight 20%)
///   composite = (completion_rate * 5000 + dispute_factor * 3000 + decay * 2000) / 10000
#[multiversx_sc::contract]
pub trait AgentReputation {
    #[init]
    fn init(&self, escrow_address: ManagedAddress, slash_threshold: u64) {
        self.escrow().set(&escrow_address);
        self.slash_threshold().set(slash_threshold); // e.g. 3 failures triggers slash review
        self.owner().set(self.blockchain().get_caller());
    }

    // ── Record Success (called by Escrow) ─────────────────────────────────────
    #[endpoint(recordSuccess)]
    fn record_success(&self, provider: ManagedAddress, service_id: ManagedBuffer) {
        require!(self.escrow().get() == self.blockchain().get_caller(), "Only escrow");
        let mut rec = self.get_or_init(&provider);
        rec.total_tasks += 1;
        rec.successful_tasks += 1;
        rec.last_updated = self.blockchain().get_block_timestamp();
        rec.composite_score = self.compute_score(&rec);
        self.records().insert(provider.clone(), rec);
        self.reputation_updated_event(&provider, &service_id, true);
    }

    // ── Record Failure (called by Escrow) ─────────────────────────────────────
    #[endpoint(recordFailure)]
    fn record_failure(&self, provider: ManagedAddress, service_id: ManagedBuffer) {
        require!(self.escrow().get() == self.blockchain().get_caller(), "Only escrow");
        let mut rec = self.get_or_init(&provider);
        rec.total_tasks += 1;
        rec.failed_tasks += 1;
        rec.last_updated = self.blockchain().get_block_timestamp();
        rec.composite_score = self.compute_score(&rec);

        // Auto-slash check
        if rec.failed_tasks % self.slash_threshold().get() == 0 {
            rec.slash_count += 1;
            self.slash_event(&provider, rec.slash_count);
        }

        self.records().insert(provider.clone(), rec);
        self.reputation_updated_event(&provider, &service_id, false);
    }

    // ── Manual slash by governance ────────────────────────────────────────────
    #[only_owner]
    #[endpoint(slashProvider)]
    fn slash_provider(&self, provider: ManagedAddress, reason: ManagedBuffer) {
        let mut rec = self.get_or_init(&provider);
        rec.slash_count += 1;
        // Penalize score heavily
        rec.composite_score = if rec.composite_score > 2000 { rec.composite_score - 2000 } else { 0 };
        self.records().insert(provider.clone(), rec);
        self.manual_slash_event(&provider, &reason);
    }

    // ── Compute composite score ───────────────────────────────────────────────
    fn compute_score(&self, rec: &ReputationRecord<Self::Api>) -> u64 {
        if rec.total_tasks == 0 { return 5000; } // neutral start

        // Completion rate weight 50%
        let completion = rec.successful_tasks * 10_000 / rec.total_tasks;
        let completion_component = completion * 50 / 100;

        // Dispute-free rate weight 30%
        let dispute_factor = if rec.disputed_tasks == 0 { 10_000 }
            else { (rec.total_tasks - rec.disputed_tasks) * 10_000 / rec.total_tasks };
        let dispute_component = dispute_factor * 30 / 100;

        // Slash penalty weight 20% — each slash costs 1000 bps
        let slash_penalty = (rec.slash_count * 1000).min(10_000);
        let activity_component = if slash_penalty >= 10_000 { 0 } else { (10_000 - slash_penalty) * 20 / 100 };

        let raw = completion_component + dispute_component + activity_component;
        raw.min(10_000) // cap at 10000
    }

    fn get_or_init(&self, provider: &ManagedAddress) -> ReputationRecord<Self::Api> {
        self.records().get(provider).unwrap_or_else(|| ReputationRecord {
            provider: provider.clone(),
            total_tasks: 0,
            successful_tasks: 0,
            failed_tasks: 0,
            disputed_tasks: 0,
            slash_count: 0,
            composite_score: 5000,
            last_updated: self.blockchain().get_block_timestamp(),
        })
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    #[view(getReputation)]
    fn get_reputation(&self, provider: ManagedAddress) -> OptionalValue<ReputationRecord<Self::Api>> {
        OptionalValue::from(self.records().get(&provider))
    }

    #[view(getScore)]
    fn get_score(&self, provider: ManagedAddress) -> u64 {
        self.records().get(&provider).map(|r| r.composite_score).unwrap_or(5000)
    }

    #[view(getTopProviders)]
    fn get_top_providers(&self, limit: usize) -> MultiValueEncoded<MultiValue2<ManagedAddress, u64>> {
        let mut all: ManagedVec<(ManagedAddress, u64)> = ManagedVec::new();
        for (addr, rec) in self.records().iter() {
            all.push((addr, rec.composite_score));
        }
        // Simple selection of top `limit` entries
        let mut out = MultiValueEncoded::new();
        let mut count = 0usize;
        for (addr, score) in all.iter() {
            if count >= limit { break; }
            out.push(MultiValue2::from((addr.clone(), score)));
            count += 1;
        }
        out
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    #[only_owner]
    #[endpoint(setEscrow)]
    fn set_escrow(&self, addr: ManagedAddress) { self.escrow().set(addr); }

    // ── Storage ───────────────────────────────────────────────────────────────
    #[storage_mapper("records")]
    fn records(&self) -> MapMapper<ManagedAddress, ReputationRecord<Self::Api>>;

    #[storage_mapper("escrow")]
    fn escrow(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("slashThreshold")]
    fn slash_threshold(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    // ── Events ────────────────────────────────────────────────────────────────
    #[event("reputationUpdated")]
    fn reputation_updated_event(&self, #[indexed] provider: &ManagedAddress, #[indexed] service: &ManagedBuffer, success: bool);

    #[event("slashed")]
    fn slash_event(&self, #[indexed] provider: &ManagedAddress, slash_count: u64);

    #[event("manualSlash")]
    fn manual_slash_event(&self, #[indexed] provider: &ManagedAddress, reason: &ManagedBuffer);
}
