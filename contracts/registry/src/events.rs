#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait EventsModule {
    #[event("serviceRegistered")]
    fn service_registered_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] service_id: &ManagedBuffer,
        descriptor_hash: &ManagedBuffer,
        category: u8,
        price_per_request: &BigUint,
        stake: &BigUint,
    );

    #[event("serviceUpdated")]
    fn service_updated_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] service_id: &ManagedBuffer,
    );

    #[event("serviceDeregistered")]
    fn service_deregistered_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        #[indexed] service_id: &ManagedBuffer,
    );
}
