#![no_std]

multiversx_sc::imports!();

use crate::storage::{ReputationRecord, StorageModule};

#[multiversx_sc::module]
pub trait ViewsModule: StorageModule {
    #[view(getReputation)]
    fn get_reputation(&self, provider: ManagedAddress) -> ReputationRecord<Self::Api> {
        self.reputation(&provider).get()
    }

    #[view(getScore)]
    fn get_score(&self, provider: ManagedAddress) -> u64 {
        self.reputation(&provider).get().score
    }

    #[view(getCompletedTasks)]
    fn get_completed_tasks(&self, provider: ManagedAddress) -> u64 {
        self.reputation(&provider).get().completed_tasks
    }
}
