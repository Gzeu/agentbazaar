multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct AgentReputation<M: ManagedTypeApi> {
    pub total_tasks: u64,
    pub successful_tasks: u64,
    pub failed_tasks: u64,
    pub disputes: u64,
    pub score: u64,
    pub stake: BigUint<M>,
    pub total_latency_ms: u64,
    pub last_updated: u64,
}

#[multiversx_sc::module]
pub trait StorageModule {
    #[storage_mapper("reputation")]
    fn reputation(&self, agent: &ManagedAddress) -> SingleValueMapper<AgentReputation<Self::Api>>;

    #[storage_mapper("minStake")]
    fn min_stake(&self) -> SingleValueMapper<BigUint>;
}
