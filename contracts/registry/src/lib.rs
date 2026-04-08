#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// Pricing model for a service.
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone, PartialEq)]
pub enum PricingModel {
    Fixed,
    Usage,
    Subscription,
    Quote,
}

/// On-chain service record stored in the Registry.
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct ServiceRecord<M: ManagedTypeApi> {
    pub name: ManagedBuffer<M>,
    pub category: ManagedBuffer<M>,
    pub endpoint: ManagedBuffer<M>,
    pub pricing_model: PricingModel,
    pub price: BigUint<M>,
    pub metadata_uri: ManagedBuffer<M>,
    pub provider: ManagedAddress<M>,
    pub stake: BigUint<M>,
    pub active: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

#[multiversx_sc::contract]
pub trait Registry {
    #[init]
    fn init(&self, min_stake: BigUint) {
        self.min_stake().set(&min_stake);
    }

    // ─── Write endpoints ────────────────────────────────────────────────────

    /// Register a new service. Caller must send at least `min_stake` EGLD.
    #[payable("EGLD")]
    #[endpoint(registerService)]
    fn register_service(
        &self,
        service_id: ManagedBuffer,
        name: ManagedBuffer,
        category: ManagedBuffer,
        endpoint: ManagedBuffer,
        pricing_model: PricingModel,
        price: BigUint,
        metadata_uri: ManagedBuffer,
    ) {
        let stake = self.call_value().egld_value().clone_value();
        require!(stake >= self.min_stake().get(), "Insufficient stake");
        require!(!service_id.is_empty(), "Empty service ID");
        require!(!self.services().contains_key(&service_id), "Service ID already registered");

        let caller = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp();

        let record = ServiceRecord {
            name: name.clone(),
            category: category.clone(),
            endpoint,
            pricing_model,
            price,
            metadata_uri,
            provider: caller.clone(),
            stake,
            active: true,
            created_at: now,
            updated_at: now,
        };

        self.services().insert(service_id.clone(), record);
        self.provider_services(&caller).insert(service_id.clone());
        self.category_services(&category).insert(service_id.clone());

        self.service_registered_event(&service_id, &caller, &name);
    }

    /// Update price and active status of an existing service.
    #[endpoint(updateService)]
    fn update_service(
        &self,
        service_id: ManagedBuffer,
        new_price: BigUint,
        active: bool,
    ) {
        require!(self.services().contains_key(&service_id), "Service not found");
        let mut record = self.services().get(&service_id).unwrap();
        require!(record.provider == self.blockchain().get_caller(), "Not the provider");

        record.price = new_price;
        record.active = active;
        record.updated_at = self.blockchain().get_block_timestamp();
        self.services().insert(service_id.clone(), record);

        self.service_updated_event(&service_id);
    }

    /// Deregister a service and return the stake to the provider.
    #[endpoint(deregisterService)]
    fn deregister_service(&self, service_id: ManagedBuffer) {
        require!(self.services().contains_key(&service_id), "Service not found");
        let record = self.services().get(&service_id).unwrap();
        require!(record.provider == self.blockchain().get_caller(), "Not the provider");

        self.services().remove(&service_id);
        self.provider_services(&record.provider).swap_remove(&service_id);
        self.category_services(&record.category).swap_remove(&service_id);

        if record.stake > BigUint::zero() {
            self.tx()
                .to(&record.provider)
                .egld(&record.stake)
                .transfer();
        }

        self.service_deregistered_event(&service_id);
    }

    // ─── View endpoints ─────────────────────────────────────────────────────

    #[view(getService)]
    fn get_service(&self, service_id: ManagedBuffer) -> OptionalValue<ServiceRecord<Self::Api>> {
        match self.services().get(&service_id) {
            Some(record) => OptionalValue::Some(record),
            None => OptionalValue::None,
        }
    }

    #[view(getServicesByProvider)]
    fn get_services_by_provider(
        &self,
        provider: ManagedAddress,
    ) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for id in self.provider_services(&provider).iter() {
            result.push(id);
        }
        result
    }

    #[view(getServicesByCategory)]
    fn get_services_by_category(
        &self,
        category: ManagedBuffer,
    ) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for id in self.category_services(&category).iter() {
            result.push(id);
        }
        result
    }

    #[view(getMinStake)]
    fn get_min_stake(&self) -> BigUint {
        self.min_stake().get()
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    #[storage_mapper("services")]
    fn services(&self) -> MapMapper<ManagedBuffer, ServiceRecord<Self::Api>>;

    #[storage_mapper("provider_services")]
    fn provider_services(
        &self,
        provider: &ManagedAddress,
    ) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("category_services")]
    fn category_services(
        &self,
        category: &ManagedBuffer,
    ) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("min_stake")]
    fn min_stake(&self) -> SingleValueMapper<BigUint>;

    // ─── Events ──────────────────────────────────────────────────────────────

    #[event("ServiceRegistered")]
    fn service_registered_event(
        &self,
        #[indexed] service_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
        name: &ManagedBuffer,
    );

    #[event("ServiceUpdated")]
    fn service_updated_event(&self, #[indexed] service_id: &ManagedBuffer);

    #[event("ServiceDeregistered")]
    fn service_deregistered_event(&self, #[indexed] service_id: &ManagedBuffer);
}
