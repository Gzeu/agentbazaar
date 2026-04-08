#![no_std]

use multiversx_sc::imports::*;

/// AgentBazaar Registry Contract
/// Stores service listings, provider metadata, stake, categories.
/// Deployed on MultiversX Supernova Devnet.
#[multiversx_sc::contract]
pub trait RegistryContract {
    // ── Storage ──────────────────────────────────────────────────────────────

    #[storage_mapper("services")]
    fn services(&self) -> MapMapper<ManagedBuffer, ServiceDescriptor<Self::Api>>;

    #[storage_mapper("provider_stake")]
    fn provider_stake(&self) -> MapMapper<ManagedAddress, BigUint>;

    #[storage_mapper("service_count")]
    fn service_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("min_stake")]
    fn min_stake(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("marketplace_fee_bps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u32>;

    // ── Init ─────────────────────────────────────────────────────────────────

    #[init]
    fn init(&self, min_stake: BigUint, fee_bps: u32) {
        self.owner().set(&self.blockchain().get_caller());
        self.min_stake().set(min_stake);
        self.marketplace_fee_bps().set(fee_bps);
        self.service_count().set(0u64);
    }

    // ── Register Service ─────────────────────────────────────────────────────

    /// Provider calls this (payable) to register a service.
    /// Payment = stake. Must be >= min_stake.
    #[payable("EGLD")]
    #[endpoint(registerService)]
    fn register_service(
        &self,
        service_id: ManagedBuffer,
        name: ManagedBuffer,
        category: ManagedBuffer,
        endpoint_url: ManagedBuffer,
        pricing_model: ManagedBuffer,
        price_per_unit: BigUint,
        max_latency_ms: u64,
        uptime_guarantee_bps: u32,
        ucp_compatible: bool,
        mcp_compatible: bool,
        metadata_hash: ManagedBuffer, // IPFS/Arweave hash of full descriptor
    ) {
        let stake = self.call_value().egld();
        let min = self.min_stake().get();
        require!(*stake >= min, "Stake below minimum");
        require!(!service_id.is_empty(), "Service ID required");
        require!(!self.services().contains_key(&service_id), "Service ID already exists");

        let provider = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp();

        let descriptor = ServiceDescriptor {
            service_id: service_id.clone(),
            name,
            category,
            provider: provider.clone(),
            endpoint_url,
            pricing_model,
            price_per_unit,
            max_latency_ms,
            uptime_guarantee_bps,
            ucp_compatible,
            mcp_compatible,
            metadata_hash,
            registered_at: now,
            active: true,
            total_tasks: 0u64,
        };

        self.services().insert(service_id.clone(), descriptor);

        // Add to provider stake
        let current_stake = self.provider_stake().get(&provider).unwrap_or_default();
        self.provider_stake().insert(provider.clone(), current_stake + &*stake);

        let count = self.service_count().get();
        self.service_count().set(count + 1);

        self.service_registered_event(&service_id, &provider, &*stake, now);
    }

    // ── Deactivate Service ───────────────────────────────────────────────────

    #[endpoint(deactivateService)]
    fn deactivate_service(&self, service_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut descriptor = self.services().get(&service_id)
            .unwrap_or_else(|| sc_panic!("Service not found"));
        require!(descriptor.provider == caller || self.owner().get() == caller, "Not authorized");
        descriptor.active = false;
        self.services().insert(service_id.clone(), descriptor);
        self.service_deactivated_event(&service_id);
    }

    // ── Increment Task Counter (called by Escrow) ────────────────────────────

    #[endpoint(incrementTaskCount)]
    fn increment_task_count(&self, service_id: ManagedBuffer) {
        if let Some(mut d) = self.services().get(&service_id) {
            d.total_tasks += 1;
            self.services().insert(service_id, d);
        }
    }

    // ── Slash provider stake (called by Reputation contract) ─────────────────

    #[endpoint(slashProvider)]
    fn slash_provider(&self, provider: ManagedAddress, amount: BigUint) {
        require!(self.owner().get() == self.blockchain().get_caller(), "Only owner");
        let stake = self.provider_stake().get(&provider).unwrap_or_default();
        require!(stake >= amount, "Insufficient stake to slash");
        self.provider_stake().insert(provider.clone(), stake - &amount);
        // Send slashed amount to owner (treasury)
        let owner = self.owner().get();
        self.tx().to(&owner).egld(&amount).transfer();
        self.provider_slashed_event(&provider, &amount);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    #[view(getService)]
    fn get_service(&self, service_id: ManagedBuffer) -> OptionalValue<ServiceDescriptor<Self::Api>> {
        OptionalValue::from(self.services().get(&service_id))
    }

    #[view(getProviderStake)]
    fn get_provider_stake(&self, provider: ManagedAddress) -> BigUint {
        self.provider_stake().get(&provider).unwrap_or_default()
    }

    #[view(getServiceCount)]
    fn get_service_count(&self) -> u64 {
        self.service_count().get()
    }

    // ── Events ───────────────────────────────────────────────────────────────

    #[event("serviceRegistered")]
    fn service_registered_event(
        &self, #[indexed] service_id: &ManagedBuffer,
        #[indexed] provider: &ManagedAddress,
        stake: &BigUint, timestamp: u64,
    );

    #[event("serviceDeactivated")]
    fn service_deactivated_event(&self, #[indexed] service_id: &ManagedBuffer);

    #[event("providerSlashed")]
    fn provider_slashed_event(&self, #[indexed] provider: &ManagedAddress, amount: &BigUint);
}

// ── Types ─────────────────────────────────────────────────────────────────

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct ServiceDescriptor<M: ManagedTypeApi> {
    pub service_id: ManagedBuffer<M>,
    pub name: ManagedBuffer<M>,
    pub category: ManagedBuffer<M>,
    pub provider: ManagedAddress<M>,
    pub endpoint_url: ManagedBuffer<M>,
    pub pricing_model: ManagedBuffer<M>,
    pub price_per_unit: BigUint<M>,
    pub max_latency_ms: u64,
    pub uptime_guarantee_bps: u32,
    pub ucp_compatible: bool,
    pub mcp_compatible: bool,
    pub metadata_hash: ManagedBuffer<M>,
    pub registered_at: u64,
    pub active: bool,
    pub total_tasks: u64,
}
