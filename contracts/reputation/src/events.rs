multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait EventsModule {
    #[event("scoreUpdated")]
    fn emit_score_updated(&self, #[indexed] agent: &ManagedAddress, score: u64);

    #[event("disputeRecorded")]
    fn emit_dispute_recorded(&self, #[indexed] agent: &ManagedAddress, new_score: u64);
}
