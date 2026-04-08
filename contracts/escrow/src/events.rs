#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait EventsModule {
    #[event("taskCreated")]
    fn emit_task_created(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] buyer: &ManagedAddress,
        #[indexed] provider: &ManagedAddress,
        service_id: &ManagedBuffer,
        amount: &BigUint,
    );

    #[event("taskCompleted")]
    fn emit_task_completed(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
        proof_hash: &ManagedBuffer,
    );

    #[event("taskRefunded")]
    fn emit_task_refunded(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] buyer: &ManagedAddress,
    );

    #[event("disputeOpened")]
    fn emit_dispute_opened(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] opener: &ManagedAddress,
        reason: &ManagedBuffer,
    );

    #[event("disputeResolved")]
    fn emit_dispute_resolved(
        &self,
        #[indexed] task_id: &ManagedBuffer,
        #[indexed] winner: &ManagedAddress,
    );
}
