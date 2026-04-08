#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub mod events;
pub mod storage;
pub mod views;

use storage::AgentReputation;

#[multiversx_sc::contract]
pub trait ReputationContract:
    storage::StorageModule
    + events::EventsModule
    + views::ViewsModule
{
    #[init]
    fn init(&self, min_stake: BigUint) {
        self.min_stake().set(&min_stake);
    }

    // ── Record a completed task ──────────────────────────────────────────────
    #[endpoint(recordSuccess)]
    fn record_success(
        &self,
        agent: ManagedAddress,
        latency_ms: u64,
    ) {
        let mut rep = self.get_or_create_reputation(&agent);
        rep.total_tasks += 1;
        rep.successful_tasks += 1;
        rep.total_latency_ms += latency_ms;
        rep.last_updated = self.blockchain().get_block_timestamp();
        self.recalculate_score(&mut rep);
        self.reputation(&agent).set(&rep);
        self.emit_score_updated(&agent, rep.score);
    }

    // ── Record a failed task ─────────────────────────────────────────────────
    #[endpoint(recordFailure)]
    fn record_failure(&self, agent: ManagedAddress) {
        let mut rep = self.get_or_create_reputation(&agent);
        rep.total_tasks += 1;
        rep.failed_tasks += 1;
        rep.last_updated = self.blockchain().get_block_timestamp();
        self.recalculate_score(&mut rep);
        self.reputation(&agent).set(&rep);
        self.emit_score_updated(&agent, rep.score);
    }

    // ── Record a dispute (slash) ─────────────────────────────────────────────
    #[endpoint(recordDispute)]
    fn record_dispute(&self, agent: ManagedAddress) {
        let mut rep = self.get_or_create_reputation(&agent);
        rep.disputes += 1;
        if rep.score >= 20u64 {
            rep.score -= 20u64;
        } else {
            rep.score = 0u64;
        }
        rep.last_updated = self.blockchain().get_block_timestamp();
        self.reputation(&agent).set(&rep);
        self.emit_dispute_recorded(&agent, rep.score);
    }

    // ── Stake for reputation boost ───────────────────────────────────────────
    #[payable("EGLD")]
    #[endpoint(stake)]
    fn stake(&self) {
        let caller = self.blockchain().get_caller();
        let payment = self.call_value().egld_value().clone_value();
        require!(
            payment >= self.min_stake().get(),
            "Stake below minimum"
        );
        let mut rep = self.get_or_create_reputation(&caller);
        rep.stake += payment;
        rep.last_updated = self.blockchain().get_block_timestamp();
        self.recalculate_score(&mut rep);
        self.reputation(&caller).set(&rep);
        self.emit_score_updated(&caller, rep.score);
    }

    // ── Unstake ──────────────────────────────────────────────────────────────
    #[endpoint(unstake)]
    fn unstake(&self, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        let mut rep = self.reputation(&caller).get();
        require!(rep.stake >= amount, "Insufficient stake");
        rep.stake -= &amount;
        self.recalculate_score(&mut rep);
        self.reputation(&caller).set(&rep);
        self.send().direct_egld(&caller, &amount);
        self.emit_score_updated(&caller, rep.score);
    }

    // ── Internal helpers ─────────────────────────────────────────────────────
    fn get_or_create_reputation(&self, agent: &ManagedAddress) -> AgentReputation<Self::Api> {
        if self.reputation(agent).is_empty() {
            AgentReputation {
                total_tasks: 0,
                successful_tasks: 0,
                failed_tasks: 0,
                disputes: 0,
                score: 50u64,
                stake: BigUint::zero(),
                total_latency_ms: 0,
                last_updated: self.blockchain().get_block_timestamp(),
            }
        } else {
            self.reputation(agent).get()
        }
    }

    fn recalculate_score(&self, rep: &mut AgentReputation<Self::Api>) {
        if rep.total_tasks == 0 {
            rep.score = 50u64;
            return;
        }
        let completion_bp = rep.successful_tasks * 10_000u64 / rep.total_tasks;
        let base = completion_bp * 70u64 / 10_000u64;
        let egld_unit = BigUint::from(1_000_000_000_000_000_000u64);
        let stake_pts_big = rep.stake.clone() / egld_unit;
        let stake_pts: u64 = if stake_pts_big > BigUint::from(20u64) {
            20u64
        } else {
            let raw = stake_pts_big.to_bytes_be();
            let mut bytes = [0u8; 8];
            for (i, b) in raw.iter().rev().enumerate() {
                if i < 8 { bytes[7 - i] = *b; }
            }
            u64::from_be_bytes(bytes)
        };
        let latency_bonus = if rep.successful_tasks > 0 {
            let avg = rep.total_latency_ms / rep.successful_tasks;
            if avg < 500 { 10u64 } else if avg < 1000 { 5u64 } else { 0u64 }
        } else { 0u64 };
        let dispute_penalty = rep.disputes * 5u64;
        let raw_score = base + stake_pts + latency_bonus;
        rep.score = if raw_score > dispute_penalty {
            let s = raw_score - dispute_penalty;
            if s > 100 { 100 } else { s }
        } else {
            0
        };
    }
}
