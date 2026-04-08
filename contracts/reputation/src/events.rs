#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait EventsModule {
    #[event("outcomeRecorded")]
    fn outcome_recorded_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
        success: bool,
        latency_ms: u64,
        new_composite_score: u64,
    );

    #[event("agentSlashed")]
    fn agent_slashed_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        reason: &ManagedBuffer,
    );
}
