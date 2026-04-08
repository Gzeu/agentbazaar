#![no_std]

multiversx_sc::imports!();

use crate::{AgentReputation, TaskOutcome};

#[multiversx_sc::module]
pub trait StorageModule {
    #[storage_mapper("agentReputation")]
    fn agent_reputation(&self, provider: &ManagedAddress) -> SingleValueMapper<AgentReputation<Self::Api>>;

    #[storage_mapper("taskOutcomes")]
    fn task_outcomes(&self, provider: &ManagedAddress) -> VecMapper<TaskOutcome<Self::Api>>;

    #[storage_mapper("registryContractAddress")]
    fn registry_contract_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("escrowContractAddress")]
    fn escrow_contract_address(&self) -> SingleValueMapper<ManagedAddress>;
}
