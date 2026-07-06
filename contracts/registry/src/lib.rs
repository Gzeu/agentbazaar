#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

use multiversx_sc::types::TimestampSeconds;

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
#[type_abi]
pub struct ServiceRecord<M: ManagedTypeApi> {
    pub provider: ManagedAddress<M>,
    pub name: ManagedBuffer<M>,
    pub category: ManagedBuffer<M>,
    pub endpoint_url: ManagedBuffer<M>,
    pub pricing_model: ManagedBuffer<M>,
    pub price: BigUint<M>,
    pub metadata_uri: ManagedBuffer<M>,
    pub stake: BigUint<M>,
    pub active: bool,
    pub registered_at: TimestampSeconds,
}

/// Minimum stake required to register a service (0.05 EGLD anti-spam)
pub const MIN_STAKE: u64 = 50_000_000_000_000_000;
/// Registration fee sent to treasury: 0.01 EGLD flat
pub const REGISTRATION_FEE: u64 = 10_000_000_000_000_000;

#[multiversx_sc::contract]
pub trait RegistryContract {
    #[init]
    fn init(&self, marketplace_fee_bps: u64, treasury_address: ManagedAddress) {
        self.marketplace_fee_bps().set(marketplace_fee_bps);
        self.treasury_address().set(&treasury_address);
        self.owner().set(self.blockchain().get_caller());
    }

    #[upgrade]
    fn upgrade(&self) {}

    // ── Storage ──────────────────────────────────────────────────────────
    #[storage_mapper("services")]
    fn services(&self) -> MapMapper<ManagedBuffer, ServiceRecord<Self::Api>>;

    #[storage_mapper("providerServices")]
    fn provider_services(&self, provider: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("marketplaceFeeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("treasuryAddress")]
    fn treasury_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    // ── Events ───────────────────────────────────────────────────────────
    #[event("serviceRegistered")]
    fn emit_service_registered(
        &self,
        #[indexed] service_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
        name: &ManagedBuffer,
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

    #[event("registrationFeeCollected")]
    fn emit_registration_fee_collected(
        &self,
        #[indexed] service_id: &ManagedBuffer,
        fee: &BigUint,
    );

    // ── Endpoints ────────────────────────────────────────────────────────

    /// Register a service. Payment must cover MIN_STAKE + REGISTRATION_FEE.
    /// REGISTRATION_FEE (0.01 EGLD) is forwarded immediately to the treasury.
    /// Remaining payment is stored as the service's stake (returned on deregister).
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
        let payment = self.call_value().egld().clone_value();
        let min_required = BigUint::from(MIN_STAKE) + BigUint::from(REGISTRATION_FEE);
        require!(
            payment >= min_required,
            "Insufficient payment: requires MIN_STAKE (0.05 EGLD) + REGISTRATION_FEE (0.01 EGLD)"
        );
        require!(
            !self.services().contains_key(&service_id),
            "Service ID already registered"
        );

        let caller = self.blockchain().get_caller();
        let reg_fee = BigUint::from(REGISTRATION_FEE);
        let stake_amount = payment.clone() - reg_fee.clone();

        // Forward registration fee to treasury immediately
        self.send().direct_egld(&self.treasury_address().get(), &reg_fee);
        self.emit_registration_fee_collected(&service_id, &reg_fee);

        let record = ServiceRecord {
            provider: caller.clone(),
            name: name.clone(),
            category: category.clone(),
            endpoint_url: endpoint_url.clone(),
            pricing_model: pricing_model.clone(),
            price: price.clone(),
            metadata_uri: metadata_uri.clone(),
            stake: stake_amount,
            active: true,
            registered_at: self.blockchain().get_block_timestamp_seconds(),
        };
        self.services().insert(service_id.clone(), record);
        self.provider_services(&caller).insert(service_id.clone());
        self.emit_service_registered(&service_id, &caller, &name);
    }

    #[endpoint(updateService)]
    fn update_service(&self, service_id: ManagedBuffer, new_price: BigUint, active: bool) {
        let caller = self.blockchain().get_caller();
        let mut record = self.services().get(&service_id)
            .unwrap_or_else(|| sc_panic!("Service not found"));
        require!(record.provider == caller, "Not service owner");
        record.price = new_price;
        record.active = active;
        self.services().insert(service_id.clone(), record);
        self.emit_service_updated(&service_id, &caller, active);
    }

    #[endpoint(deregisterService)]
    fn deregister_service(&self, service_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let record = self.services().get(&service_id)
            .unwrap_or_else(|| sc_panic!("Service not found"));
        require!(record.provider == caller, "Not service owner");
        let stake = record.stake.clone();
        self.services().remove(&service_id);
        self.provider_services(&caller).swap_remove(&service_id);
        // Return only the stake (registration fee is non-refundable)
        if stake > BigUint::zero() {
            self.send().direct_egld(&caller, &stake);
        }
        self.emit_service_deregistered(&service_id, &caller);
    }

    // ── Owner endpoints ──────────────────────────────────────────────────

    #[endpoint(setMarketplaceFee)]
    fn set_marketplace_fee(&self, fee_bps: u64) {
        require!(self.blockchain().get_caller() == self.owner().get(), "Not owner");
        require!(fee_bps <= 1000, "Fee too high (max 10%)");
        self.marketplace_fee_bps().set(fee_bps);
    }

    #[endpoint(setTreasuryAddress)]
    fn set_treasury_address(&self, new_treasury: ManagedAddress) {
        require!(self.blockchain().get_caller() == self.owner().get(), "Not owner");
        self.treasury_address().set(&new_treasury);
    }

    // ── Views ────────────────────────────────────────────────────────────

    #[view(getService)]
    fn get_service(&self, service_id: ManagedBuffer) -> OptionalValue<ServiceRecord<Self::Api>> {
        match self.services().get(&service_id) {
            Some(r) => OptionalValue::Some(r),
            None => OptionalValue::None,
        }
    }

    #[view(getServicesByProvider)]
    fn get_services_by_provider(&self, provider: ManagedAddress) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for id in self.provider_services(&provider).iter() {
            result.push(id);
        }
        result
    }

    #[view(getMarketplaceFeeBps)]
    fn get_marketplace_fee_bps(&self) -> u64 { self.marketplace_fee_bps().get() }

    #[view(getTreasuryAddress)]
    fn get_treasury_address(&self) -> ManagedAddress { self.treasury_address().get() }

    #[view(serviceExists)]
    fn service_exists(&self, service_id: ManagedBuffer) -> bool {
        self.services().contains_key(&service_id)
    }
}
