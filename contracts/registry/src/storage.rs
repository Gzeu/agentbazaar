#![no_std]

multiversx_sc::imports!();

use crate::ServiceEntry;

#[multiversx_sc::module]
pub trait StorageModule {
    #[storage_mapper("serviceById")]
    fn service_by_id(&self, service_id: &ManagedBuffer) -> SingleValueMapper<ServiceEntry<Self::Api>>;

    #[storage_mapper("servicesByProvider")]
    fn services_by_provider(&self, provider: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("servicesByCategory")]
    fn services_by_category(&self, category: u8) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("serviceCount")]
    fn service_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("minStake")]
    fn min_stake(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("reputationContractAddress")]
    fn reputation_contract_address(&self) -> SingleValueMapper<ManagedAddress>;
}
