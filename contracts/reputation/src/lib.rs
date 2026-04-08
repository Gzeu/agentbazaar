#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
#[type_abi]
pub struct AgentReputation<M: ManagedTypeApi> {
    pub total_tasks: u64,
    pub successful_tasks: u64,
    pub failed_tasks: u64,
    pub disputes: u64,
    pub total_latency_ms: u64,
    pub stake: BigUint<M>,
    pub score: u64,
    pub last_updated: u64,
}

#[multiversx_sc::contract]
pub trait ReputationContract {
    #[init]
    fn init(&self, min_stake: BigUint) {
        self.min_stake().set(&min_stake);
    }

    // ----------------------------------------------------------------
    // Storage
    // ----------------------------------------------------------------

    #[storage_mapper("reputation")]
    fn reputation(&self, agent: &ManagedAddress) -> SingleValueMapper<AgentReputation<Self::Api>>;

    #[storage_mapper("minStake")]
    fn min_stake(&self) -> SingleValueMapper<BigUint<Self::Api>>;

    // ----------------------------------------------------------------
    // Events
    // ----------------------------------------------------------------

    #[event("scoreUpdated")]
    fn emit_score_updated(
        &self,
        #[indexed] agent: &ManagedAddress,
        score: u64,
    );

    #[event("agentSlashed")]
    fn emit_agent_slashed(
        &self,
        #[indexed] agent: &ManagedAddress,
        amount: &BigUint,
    );

    // ----------------------------------------------------------------
    // Internal helpers
    // ----------------------------------------------------------------

    fn get_or_create_reputation(&self, agent: &ManagedAddress) -> AgentReputation<Self::Api> {
        if self.reputation(agent).is_empty() {
            AgentReputation {
                total_tasks: 0,
                successful_tasks: 0,
                failed_tasks: 0,
                disputes: 0,
                total_latency_ms: 0,
                stake: BigUint::zero(),
                score: 50, // Default neutral score
                last_updated: self.blockchain().get_block_timestamp(),
            }
        } else {
            self.reputation(agent).get()
        }
    }

    fn recalculate_score(&self, rep: &mut AgentReputation<Self::Api>) {
        if rep.total_tasks == 0 {
            rep.score = 50;
            return;
        }
        let completion_bp = rep.successful_tasks * 10_000u64 / rep.total_tasks;
        let base = completion_bp * 70u64 / 10_000u64;
        let egld_unit = BigUint::from(1_000_000_000_000_000_000u64);
        let stake_pts_big = rep.stake.clone() / egld_unit;
        let stake_pts: u64 = if stake_pts_big > BigUint::from(20u64) {
            20u64
        } else {
            // Simplified stake calculation - use 0 for now
            0u64
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

    // ----------------------------------------------------------------
    // Public endpoints
    // ----------------------------------------------------------------

    /// Record a successful task completion
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

    /// Record a failed task
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

    /// Record a dispute (penalty)
    #[endpoint(recordDispute)]
    fn record_dispute(&self, agent: ManagedAddress) {
        let mut rep = self.get_or_create_reputation(&agent);
        rep.disputes += 1;
        rep.last_updated = self.blockchain().get_block_timestamp();
        self.recalculate_score(&mut rep);
        self.reputation(&agent).set(&rep);
        self.emit_score_updated(&agent, rep.score);
    }

    /// Update stake amount
    #[endpoint(updateStake)]
    fn update_stake(&self, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        let mut rep = self.get_or_create_reputation(&caller);
        rep.stake = amount.clone();
        rep.last_updated = self.blockchain().get_block_timestamp();
        self.recalculate_score(&mut rep);
        self.reputation(&caller).set(&rep);
        self.emit_score_updated(&caller, rep.score);
    }

    /// Slash agent for misconduct
    #[endpoint(slashAgent)]
    fn slash_agent(&self, agent: ManagedAddress, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        // Only authorized callers can slash (e.g., from escrow contract)
        require!(caller == self.blockchain().get_owner_address(), "Not authorized");
        
        let mut rep = self.get_or_create_reputation(&agent);
        rep.disputes += 1;
        rep.last_updated = self.blockchain().get_block_timestamp();
        self.recalculate_score(&mut rep);
        self.reputation(&agent).set(&rep);
        
        // Transfer slashed amount to caller
        if amount > BigUint::zero() {
            self.send().direct_egld(&caller, &amount);
        }
        
        self.emit_agent_slashed(&agent, &amount);
    }

    // ----------------------------------------------------------------
    // View endpoints
    // ----------------------------------------------------------------

    #[view(getReputation)]
    fn get_reputation(&self, agent: ManagedAddress) -> OptionalValue<AgentReputation<Self::Api>> {
        if self.reputation(&agent).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.reputation(&agent).get())
        }
    }

    #[view(getScore)]
    fn get_score(&self, agent: ManagedAddress) -> u64 {
        if self.reputation(&agent).is_empty() {
            50 // Default neutral score
        } else {
            self.reputation(&agent).get().score
        }
    }

    #[view(getMinStake)]
    fn get_min_stake(&self) -> BigUint<Self::Api> {
        self.min_stake().get()
    }
}
