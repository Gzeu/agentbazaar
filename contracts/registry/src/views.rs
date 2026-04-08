#![no_std]

multiversx_sc::imports!();

use crate::{ServiceEntry, storage::StorageModule};

#[multiversx_sc::module]
pub trait ViewsModule: StorageModule {
    #[view(getService)]
    fn get_service(&self, service_id: ManagedBuffer) -> OptionalValue<ServiceEntry<Self::Api>> {
        if self.service_by_id(&service_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.service_by_id(&service_id).get())
        }
    }

    #[view(getServicesByProvider)]
    fn get_services_by_provider(
        &self,
        provider: ManagedAddress,
    ) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for id in self.services_by_provider(&provider).iter() {
            result.push(id);
        }
        result
    }

    #[view(getServicesByCategory)]
    fn get_services_by_category(
        &self,
        category: u8,
    ) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for id in self.services_by_category(category).iter() {
            result.push(id);
        }
        result
    }

    #[view(getServiceCount)]
    fn get_service_count(&self) -> u64 {
        self.service_count().get()
    }

    #[view(getMinStake)]
    fn get_min_stake(&self) -> BigUint {
        self.min_stake().get()
    }
}
