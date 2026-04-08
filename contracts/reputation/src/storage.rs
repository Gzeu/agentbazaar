#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct ReputationRecord<M: ManagedTypeApi> {
    pub score: u64,
    pub completed_tasks: u64,
    pub failed_tasks: u64,
    pub disputed_tasks: u64,
    pub total_latency_ms: u64,
    pub last_proof_hash: ManagedBuffer<M>,
    pub last_updated: u64,
}

impl<M: ManagedTypeApi> Default for ReputationRecord<M> {
    fn default() -> Self {
        ReputationRecord {
            score: 50,
            completed_tasks: 0,
            failed_tasks: 0,
            disputed_tasks: 0,
            total_latency_ms: 0,
            last_proof_hash: ManagedBuffer::new(),
            last_updated: 0,
        }
    }
}

#[multiversx_sc::module]
pub trait StorageModule {
    #[storage_mapper("reputation")]
    fn reputation(&self, provider: &ManagedAddress) -> SingleValueMapper<ReputationRecord<Self::Api>>;

    #[storage_mapper("escrowAddress")]
    fn escrow_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;
}
