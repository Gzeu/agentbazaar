#![no_std]

multiversx_sc::imports!();

use crate::EscrowEntry;

#[multiversx_sc::module]
pub trait StorageModule {
    #[storage_mapper("escrowByTaskId")]
    fn escrow_by_task_id(&self, task_id: &ManagedBuffer) -> SingleValueMapper<EscrowEntry<Self::Api>>;

    #[storage_mapper("tasksByConsumer")]
    fn tasks_by_consumer(&self, consumer: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("tasksByProvider")]
    fn tasks_by_provider(&self, provider: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("marketplaceFeeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("feeCollector")]
    fn fee_collector(&self) -> SingleValueMapper<ManagedAddress>;
}
