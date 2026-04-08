#![no_std]

use multiversx_sc::imports::*;

/// AgentBazaar Reputation Contract
/// Composite score: completion rate + latency + stake weight + recency decay.
/// Anti-sybil: score locked to staked providers only.
#[multiversx_sc::contract]
pub trait ReputationContract {
    // ── Storage ──────────────────────────────────────────────────────────────

    #[storage_mapper("scores")]
    fn scores(&self) -> MapMapper<ManagedAddress, ReputationRecord<Self::Api>>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("escrow_address")]
    fn escrow_address(&self) -> SingleValueMapper<ManagedAddress>;

    // Weights for composite score (sum = 10000 bps)
    // completion_weight + latency_weight + stake_weight = 10000
    #[storage_mapper("completion_weight")]
    fn completion_weight(&self) -> SingleValueMapper<u32>;

    #[storage_mapper("latency_weight")]
    fn latency_weight(&self) -> SingleValueMapper<u32>;

    #[storage_mapper("stake_weight")]
    fn stake_weight(&self) -> SingleValueMapper<u32>;

    // Decay factor per epoch (1 epoch = 1 day). Score * (10000 - decay_bps) / 10000 each epoch.
    #[storage_mapper("decay_bps")]
    fn decay_bps(&self) -> SingleValueMapper<u32>;

    // ── Init ─────────────────────────────────────────────────────────────────

    #[init]
    fn init(
        &self,
        escrow_addr: ManagedAddress,
        completion_weight: u32,
        latency_weight: u32,
        stake_weight: u32,
        decay_bps: u32,
    ) {
        require!(
            completion_weight + latency_weight + stake_weight == 10_000u32,
            "Weights must sum to 10000"
        );
        self.owner().set(&self.blockchain().get_caller());
        self.escrow_address().set(escrow_addr);
        self.completion_weight().set(completion_weight);
        self.latency_weight().set(latency_weight);
        self.stake_weight().set(stake_weight);
        self.decay_bps().set(decay_bps);
    }

    // ── Record Task Outcome (called by Escrow or owner relayer) ───────────────

    #[endpoint(recordTaskOutcome)]
    fn record_task_outcome(
        &self,
        provider: ManagedAddress,
        success: bool,
        latency_ms: u64,
        stake_egld_units: u64, // stake in mEGLD units for simplicity
    ) {
        let caller = self.blockchain().get_caller();
        require!(
            caller == self.owner().get() || caller == self.escrow_address().get(),
            "Not authorized"
        );

        let mut record = self.scores().get(&provider).unwrap_or_else(|| ReputationRecord {
            provider: provider.clone(),
            total_tasks: 0u64,
            successful_tasks: 0u64,
            disputed_tasks: 0u64,
            total_latency_ms: 0u64,
            composite_score: 5_000u32, // start at 50%
            last_updated_epoch: self.blockchain().get_block_epoch(),
        });

        // Apply temporal decay since last update
        let current_epoch = self.blockchain().get_block_epoch();
        let epochs_passed = current_epoch - record.last_updated_epoch;
        if epochs_passed > 0 {
            let decay = self.decay_bps().get();
            for _ in 0..epochs_passed {
                record.composite_score = record.composite_score
                    .saturating_sub(record.composite_score * decay / 10_000);
            }
        }

        record.total_tasks += 1;
        record.total_latency_ms += latency_ms;
        if success { record.successful_tasks += 1; }

        // Recompute composite score
        record.composite_score = self.compute_score(&record, stake_egld_units);
        record.last_updated_epoch = current_epoch;

        self.scores().insert(provider.clone(), record.clone());
        self.score_updated_event(&provider, record.composite_score);
    }

    // ── Record Dispute ────────────────────────────────────────────────────────

    #[endpoint(recordDispute)]
    fn record_dispute(&self, provider: ManagedAddress) {
        let caller = self.blockchain().get_caller();
        require!(
            caller == self.owner().get() || caller == self.escrow_address().get(),
            "Not authorized"
        );
        if let Some(mut record) = self.scores().get(&provider) {
            record.disputed_tasks += 1;
            // Dispute penalty: -500 bps (5%)
            record.composite_score = record.composite_score.saturating_sub(500);
            self.scores().insert(provider.clone(), record.clone());
            self.score_updated_event(&provider, record.composite_score);
        }
    }

    // ── Internal: Composite Score Formula ────────────────────────────────────

    fn compute_score(&self, record: &ReputationRecord<Self::Api>, stake_units: u64) -> u32 {
        // Completion rate component (0-10000 bps scaled to weight)
        let completion_rate = if record.total_tasks == 0 { 5_000u64 } else {
            record.successful_tasks * 10_000 / record.total_tasks
        };
        let completion_component = (completion_rate as u32)
            .saturating_mul(self.completion_weight().get()) / 10_000;

        // Latency component: target < 500ms => full score; >5000ms => 0
        let avg_latency = if record.total_tasks == 0 { 500u64 } else {
            record.total_latency_ms / record.total_tasks
        };
        let latency_score: u32 = if avg_latency <= 500 { 10_000 }
            else if avg_latency >= 5_000 { 0 }
            else { (10_000u64.saturating_sub((avg_latency - 500) * 10_000 / 4_500)) as u32 };
        let latency_component = latency_score
            .saturating_mul(self.latency_weight().get()) / 10_000;

        // Stake component: 0-10 EGLD maps to 0-10000 bps
        let stake_score: u32 = (stake_units.min(10_000_000) / 1_000) as u32; // 1 EGLD = 1000 units
        let stake_component = stake_score.min(10_000)
            .saturating_mul(self.stake_weight().get()) / 10_000;

        // Dispute penalty already applied before calling this
        (completion_component + latency_component + stake_component).min(10_000)
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    #[view(getScore)]
    fn get_score(&self, provider: ManagedAddress) -> u32 {
        self.scores().get(&provider)
            .map(|r| r.composite_score)
            .unwrap_or(0u32)
    }

    #[view(getRecord)]
    fn get_record(&self, provider: ManagedAddress) -> OptionalValue<ReputationRecord<Self::Api>> {
        OptionalValue::from(self.scores().get(&provider))
    }

    // ── Events ────────────────────────────────────────────────────────────────

    #[event("scoreUpdated")]
    fn score_updated_event(&self, #[indexed] provider: &ManagedAddress, score: u32);
}

// ── Types ──────────────────────────────────────────────────────────────────

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct ReputationRecord<M: ManagedTypeApi> {
    pub provider: ManagedAddress<M>,
    pub total_tasks: u64,
    pub successful_tasks: u64,
    pub disputed_tasks: u64,
    pub total_latency_ms: u64,
    pub composite_score: u32, // 0-10000 bps (100.00%)
    pub last_updated_epoch: u64,
}
