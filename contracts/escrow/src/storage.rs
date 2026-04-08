#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone)]
pub enum TaskStatus {
    Pending,
    Completed,
    Refunded,
    Disputed,
}

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, ManagedVecItem, Clone)]
pub struct TaskRecord<M: ManagedTypeApi> {
    pub buyer: ManagedAddress<M>,
    pub provider: ManagedAddress<M>,
    pub service_id: ManagedBuffer<M>,
    pub amount: BigUint<M>,
    pub status: TaskStatus,
    pub payload_hash: ManagedBuffer<M>,
    pub proof_hash: ManagedBuffer<M>,
    pub created_at: u64,
    pub completed_at: u64,
}

#[multiversx_sc::module]
pub trait StorageModule {
    #[storage_mapper("tasks")]
    fn tasks(&self) -> MapMapper<ManagedBuffer, TaskRecord<Self::Api>>;

    #[storage_mapper("registryAddress")]
    fn registry_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("reputationAddress")]
    fn reputation_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;
}
