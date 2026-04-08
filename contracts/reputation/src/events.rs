#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait EventsModule {
    #[event("reputationUpdated")]
    fn emit_reputation_updated(
        &self,
        #[indexed] provider: &ManagedAddress,
        score: u64,
        completed_tasks: u64,
    );

    #[event("slashEvent")]
    fn emit_slash_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
        reason: ManagedBuffer,
    );
}
