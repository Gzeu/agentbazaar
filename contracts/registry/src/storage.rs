#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, ManagedVecItem, Clone)]
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

#[multiversx_sc::module]
pub trait StorageModule {
    #[storage_mapper("services")]
    fn services(&self) -> MapMapper<ManagedBuffer, ServiceRecord<Self::Api>>;

    #[storage_mapper("providerServices")]
    fn provider_services(&self, provider: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("marketplaceFeeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;
}
