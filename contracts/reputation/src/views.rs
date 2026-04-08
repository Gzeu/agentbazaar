#![no_std]

multiversx_sc::imports!();

use crate::{AgentReputation, storage::StorageModule};

#[multiversx_sc::module]
pub trait ViewsModule: StorageModule {
    #[view(getReputation)]
    fn get_reputation(&self, provider: ManagedAddress) -> OptionalValue<AgentReputation<Self::Api>> {
        if self.agent_reputation(&provider).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.agent_reputation(&provider).get())
        }
    }

    #[view(getCompositeScore)]
    fn get_composite_score(&self, provider: ManagedAddress) -> u64 {
        if self.agent_reputation(&provider).is_empty() {
            return 5000; // Default 50%
        }
        self.agent_reputation(&provider).get().composite_score
    }

    #[view(getTotalTasks)]
    fn get_total_tasks(&self, provider: ManagedAddress) -> u64 {
        if self.agent_reputation(&provider).is_empty() {
            return 0;
        }
        self.agent_reputation(&provider).get().total_tasks
    }
}
