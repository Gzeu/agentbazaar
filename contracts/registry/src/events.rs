#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait EventsModule {
    #[event("serviceRegistered")]
    fn emit_service_registered(
        &self,
        #[indexed] service_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
        name: &ManagedBuffer,
        category: &ManagedBuffer,
        price: &BigUint,
    );

    #[event("serviceUpdated")]
    fn emit_service_updated(
        &self,
        #[indexed] service_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
        active: bool,
    );

    #[event("serviceDeregistered")]
    fn emit_service_deregistered(
        &self,
        #[indexed] service_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
    );
}
