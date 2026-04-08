#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, ManagedVecItem, Clone)]
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
    pub registered_at: u64,
}

pub const MIN_STAKE: u64 = 50_000_000_000_000_000;

#[multiversx_sc::contract]
pub trait RegistryContract {
    #[init]
    fn init(&self, marketplace_fee_bps: u64) {
        self.marketplace_fee_bps().set(marketplace_fee_bps);
        self.owner().set(self.blockchain().get_caller());
    }

    #[upgrade]
    fn upgrade(&self) {}

    #[storage_mapper("services")]
    fn services(&self) -> MapMapper<ManagedBuffer, ServiceRecord<Self::Api>>;

    #[storage_mapper("providerServices")]
    fn provider_services(&self, provider: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("marketplaceFeeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

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
            registered_at: self.blockchain().get_block_timestamp_seconds().into(),
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
        if stake > BigUint::zero() {
            self.send().direct_egld(&caller, &stake);
        }
        self.emit_service_deregistered(&service_id, &caller);
    }

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

    #[view(serviceExists)]
    fn service_exists(&self, service_id: ManagedBuffer) -> bool {
        self.services().contains_key(&service_id)
    }

    #[endpoint(setMarketplaceFee)]
    fn set_marketplace_fee(&self, fee_bps: u64) {
        require!(self.blockchain().get_caller() == self.owner().get(), "Not owner");
        require!(fee_bps <= 1000, "Fee too high (max 10%)");
        self.marketplace_fee_bps().set(fee_bps);
    }
}
