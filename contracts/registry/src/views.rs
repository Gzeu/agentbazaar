#![no_std]

multiversx_sc::imports!();

use crate::storage::{ServiceRecord, StorageModule};

#[multiversx_sc::module]
pub trait ViewsModule: StorageModule {
    #[view(getService)]
    fn get_service(&self, service_id: ManagedBuffer) -> OptionalValue<ServiceRecord<Self::Api>> {
        match self.services().get(&service_id) {
            Some(r) => OptionalValue::Some(r),
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

    #[view(getMarketplaceFeeBps)]
    fn get_marketplace_fee_bps(&self) -> u64 {
        self.marketplace_fee_bps().get()
    }

    #[view(serviceExists)]
    fn service_exists(&self, service_id: ManagedBuffer) -> bool {
        self.services().contains_key(&service_id)
    }
}
