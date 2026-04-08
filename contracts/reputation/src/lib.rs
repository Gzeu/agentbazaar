#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub mod events;
pub mod storage;
pub mod views;

/// Decay factor: 95% per event (scaled x100 for integer math)
const DECAY_NUMERATOR: u64 = 95;
const DECAY_DENOMINATOR: u64 = 100;

/// Score weights (sum = 100)
const WEIGHT_COMPLETION: u64 = 40;
const WEIGHT_STAKE: u64 = 25;
const WEIGHT_LATENCY: u64 = 20;
const WEIGHT_DISPUTE_PENALTY: u64 = 15;

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct AgentReputation<M: ManagedTypeApi> {
    pub agent: ManagedAddress<M>,
    pub total_tasks: u64,
    pub successful_tasks: u64,
    pub disputed_tasks: u64,
    pub total_latency_ms: u64,     // sum of all task latencies
    pub composite_score: u64,      // 0-10000 basis points
    pub last_updated: u64,
    pub slashed: bool,
}

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi)]
pub struct TaskOutcome<M: ManagedTypeApi> {
    pub task_id: ManagedBuffer<M>,
    pub provider: ManagedAddress<M>,
    pub success: bool,
    pub latency_ms: u64,
    pub timestamp: u64,
}

#[multiversx_sc::contract]
pub trait ReputationContract:
    storage::StorageModule
    + views::ViewsModule
    + events::EventsModule
{
    #[init]
    fn init(&self, registry_contract: ManagedAddress) {
        self.registry_contract_address().set(&registry_contract);
    }

    #[upgrade]
    fn upgrade(&self) {}

    // -------------------------------------------------------------------------
    // WRITE ENDPOINTS
    // -------------------------------------------------------------------------

    /// Called by Escrow contract after task settlement to record outcome
    #[endpoint(recordOutcome)]
    fn record_outcome(
        &self,
        task_id: ManagedBuffer,
        provider: ManagedAddress,
        success: bool,
        latency_ms: u64,
    ) {
        let escrow_addr = self.escrow_contract_address().get();
        require!(
            self.blockchain().get_caller() == escrow_addr,
            "Unauthorized: only escrow contract"
        );

        let now = self.blockchain().get_block_timestamp();

        let outcome = TaskOutcome {
            task_id: task_id.clone(),
            provider: provider.clone(),
            success,
            latency_ms,
            timestamp: now,
        };
        self.task_outcomes(&provider).push(&outcome);

        let mut rep = if self.agent_reputation(&provider).is_empty() {
            AgentReputation {
                agent: provider.clone(),
                total_tasks: 0,
                successful_tasks: 0,
                disputed_tasks: 0,
                total_latency_ms: 0,
                composite_score: 5000,
                last_updated: now,
                slashed: false,
            }
        } else {
            self.agent_reputation(&provider).get()
        };

        rep.total_tasks += 1;
        if success {
            rep.successful_tasks += 1;
        }
        rep.total_latency_ms += latency_ms;

        // Recalculate composite score with decay
        let new_score = self.calculate_score(&rep);
        let decayed = (rep.composite_score * DECAY_NUMERATOR / DECAY_DENOMINATOR)
            + (new_score * (DECAY_DENOMINATOR - DECAY_NUMERATOR) / DECAY_DENOMINATOR);
        rep.composite_score = decayed.min(10000);
        rep.last_updated = now;

        self.agent_reputation(&provider).set(&rep);

        // Cross-call registry to update score there as well
        let registry_addr = self.registry_contract_address().get();
        self.registry_proxy(registry_addr)
            .update_reputation_score(ManagedBuffer::new(), rep.composite_score, 1u64)
            .execute_on_dest_context::<()>();

        self.outcome_recorded_event(&provider, &task_id, success, latency_ms, rep.composite_score);
    }

    /// Slash an agent for fraudulent behavior
    #[only_owner]
    #[endpoint(slashAgent)]
    fn slash_agent(&self, provider: ManagedAddress, reason: ManagedBuffer) {
        if !self.agent_reputation(&provider).is_empty() {
            let mut rep = self.agent_reputation(&provider).get();
            rep.slashed = true;
            rep.composite_score = 0;
            rep.disputed_tasks += 1;
            self.agent_reputation(&provider).set(&rep);
        }
        self.agent_slashed_event(&provider, &reason);
    }

    #[only_owner]
    #[endpoint(setEscrowContract)]
    fn set_escrow_contract(&self, address: ManagedAddress) {
        self.escrow_contract_address().set(&address);
    }

    // -------------------------------------------------------------------------
    // INTERNAL
    // -------------------------------------------------------------------------

    fn calculate_score(&self, rep: &AgentReputation<Self::Api>) -> u64 {
        if rep.total_tasks == 0 {
            return 5000;
        }

        // Completion rate (0-10000 bps)
        let completion_rate = rep.successful_tasks * 10000 / rep.total_tasks;

        // Latency score: target <= 2000ms = 10000, penalize linearly
        let avg_latency = rep.total_latency_ms / rep.total_tasks;
        let latency_score = if avg_latency <= 2000 {
            10000u64
        } else if avg_latency >= 10000 {
            0u64
        } else {
            10000u64 - (avg_latency - 2000) * 10000 / 8000
        };

        // Dispute penalty (0-10000 bps)
        let dispute_rate = rep.disputed_tasks * 10000 / rep.total_tasks;
        let dispute_penalty = dispute_rate; // Higher dispute rate = higher penalty

        // Composite
        let score = (completion_rate * WEIGHT_COMPLETION
            + latency_score * WEIGHT_LATENCY)
            / (WEIGHT_COMPLETION + WEIGHT_LATENCY)
            + WEIGHT_STAKE * 100 // placeholder until stake integration
            ;

        score.saturating_sub(dispute_penalty * WEIGHT_DISPUTE_PENALTY / 100)
            .min(10000)
    }

    // Proxy to registry contract
    #[proxy]
    fn registry_proxy(&self, to: ManagedAddress) -> registry_proxy::Proxy<Self::Api>;
}

mod registry_proxy {
    multiversx_sc::imports!();

    #[multiversx_sc::proxy]
    pub trait RegistryProxy {
        #[endpoint(updateReputationScore)]
        fn update_reputation_score(
            &self,
            service_id: ManagedBuffer,
            new_score: u64,
            delta_tasks: u64,
        );
    }
}
