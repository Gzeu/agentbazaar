#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub mod events;
pub mod storage;
pub mod views;

use storage::ServiceRecord;

/// Minimum stake required to register a service (0.05 EGLD).
pub const MIN_STAKE: u64 = 50_000_000_000_000_000;

#[multiversx_sc::contract]
pub trait RegistryContract:
    storage::StorageModule
    + views::ViewsModule
    + events::EventsModule
{
    #[init]
    fn init(&self, marketplace_fee_bps: u64) {
        self.marketplace_fee_bps().set(marketplace_fee_bps);
        self.owner().set(self.blockchain().get_caller());
    }

    #[upgrade]
    fn upgrade(&self) {}

    // ----------------------------------------------------------------
    // Write endpoints
    // ----------------------------------------------------------------

    /// Register a new service. Requires MIN_STAKE EGLD attached.
    #[payable("EGLD")]
    #[endpoint(registerService)]
    fn register_service(
        &self,
        service_id: ManagedBuffer,
        name: ManagedBuffer,
        category: ManagedBuffer,
        endpoint_url: ManagedBuffer,
        pricing_model: ManagedBuffer,
        price: BigUint,
        metadata_uri: ManagedBuffer,
    ) {
        let payment = self.call_value().egld_value().clone_value();
        require!(
            payment >= BigUint::from(MIN_STAKE),
            "Insufficient stake: minimum 0.05 EGLD required"
        );
        require!(
            !self.services().contains_key(&service_id),
            "Service ID already registered"
        );

        let caller = self.blockchain().get_caller();
        let record = ServiceRecord {
            provider: caller.clone(),
            name: name.clone(),
            category: category.clone(),
            endpoint_url: endpoint_url.clone(),
            pricing_model: pricing_model.clone(),
            price: price.clone(),
            metadata_uri: metadata_uri.clone(),
            stake: payment.clone(),
            active: true,
            registered_at: self.blockchain().get_block_timestamp(),
        };

        self.services().insert(service_id.clone(), record);
        self.provider_services(&caller).insert(service_id.clone());

        self.emit_service_registered(
            &service_id,
            &caller,
            &name,
            &category,
            &price,
        );
    }

    /// Update price and active status of an existing service.
    #[endpoint(updateService)]
    fn update_service(
        &self,
        service_id: ManagedBuffer,
        new_price: BigUint,
        active: bool,
    ) {
        let caller = self.blockchain().get_caller();
        let mut record = self.services().get(&service_id)
            .unwrap_or_else(|| sc_panic!("Service not found"));
        require!(record.provider == caller, "Not service owner");

        record.price = new_price;
        record.active = active;
        self.services().insert(service_id.clone(), record);

        self.emit_service_updated(&service_id, &caller, active);
    }

    /// Deregister a service and return stake to provider.
    #[endpoint(deregisterService)]
    fn deregister_service(&self, service_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let record = self.services().get(&service_id)
            .unwrap_or_else(|| sc_panic!("Service not found"));
        require!(record.provider == caller, "Not service owner");

        let stake = record.stake.clone();
        self.services().remove(&service_id);
        self.provider_services(&caller).swap_remove(&service_id);

        if stake > BigUint::zero() {
            self.send().direct_egld(&caller, &stake);
        }

        self.emit_service_deregistered(&service_id, &caller);
    }

    // ----------------------------------------------------------------
    // Owner endpoints
    // ----------------------------------------------------------------

    #[endpoint(setMarketplaceFee)]
    fn set_marketplace_fee(&self, fee_bps: u64) {
        let caller = self.blockchain().get_caller();
        require!(caller == self.owner().get(), "Not owner");
        require!(fee_bps <= 1000, "Fee too high (max 10%)");
        self.marketplace_fee_bps().set(fee_bps);
    }
}
