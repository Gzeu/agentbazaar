multiversx_sc::imports!();

use crate::storage::AgentReputation;

#[multiversx_sc::module]
pub trait ViewsModule: crate::storage::StorageModule {
    #[view(getReputation)]
    fn get_reputation_view(&self, agent: ManagedAddress) -> AgentReputation<Self::Api> {
        if self.reputation(&agent).is_empty() {
            AgentReputation {
                total_tasks: 0,
                successful_tasks: 0,
                failed_tasks: 0,
                disputes: 0,
                score: 50u64,
                stake: BigUint::zero(),
                total_latency_ms: 0,
                last_updated: 0,
            }
        } else {
            self.reputation(&agent).get()
        }
    }

    #[view(getScore)]
    fn get_score(&self, agent: ManagedAddress) -> u64 {
        if self.reputation(&agent).is_empty() {
            return 50u64;
        }
        self.reputation(&agent).get().score
    }
}
