#![no_std]

multiversx_sc::imports!();

use crate::{EscrowEntry, storage::StorageModule};

#[multiversx_sc::module]
pub trait ViewsModule: StorageModule {
    #[view(getTask)]
    fn get_task(&self, task_id: ManagedBuffer) -> OptionalValue<EscrowEntry<Self::Api>> {
        if self.escrow_by_task_id(&task_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.escrow_by_task_id(&task_id).get())
        }
    }

    #[view(getTasksByConsumer)]
    fn get_tasks_by_consumer(&self, consumer: ManagedAddress) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for id in self.tasks_by_consumer(&consumer).iter() {
            result.push(id);
        }
        result
    }

    #[view(getTasksByProvider)]
    fn get_tasks_by_provider(&self, provider: ManagedAddress) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for id in self.tasks_by_provider(&provider).iter() {
            result.push(id);
        }
        result
    }

    #[view(getMarketplaceFee)]
    fn get_marketplace_fee(&self) -> u64 {
        self.marketplace_fee_bps().get()
    }
}
