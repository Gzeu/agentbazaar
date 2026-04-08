#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait EventsModule {
    #[event("escrowCreated")]
    fn escrow_created_event(
        &self,
        #[indexed] consumer: &ManagedAddress,
        #[indexed] provider: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
        service_id: &ManagedBuffer,
        amount: &BigUint,
    );

    #[event("proofSubmitted")]
    fn proof_submitted_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
        proof_hash: &ManagedBuffer,
    );

    #[event("escrowReleased")]
    fn escrow_released_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
        amount: &BigUint,
        fee: &BigUint,
    );

    #[event("escrowRefunded")]
    fn escrow_refunded_event(
        &self,
        #[indexed] consumer: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
        amount: &BigUint,
    );

    #[event("disputeRaised")]
    fn dispute_raised_event(
        &self,
        #[indexed] consumer: &ManagedAddress,
        #[indexed] task_id: &ManagedBuffer,
    );

    #[event("disputeResolved")]
    fn dispute_resolved_event(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        favor_provider: bool,
    );
}
