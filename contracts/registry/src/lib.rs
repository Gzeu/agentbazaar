#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// ─── Service Descriptor ───────────────────────────────────────────────────────
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, ManagedVecItem, Clone)]
pub struct ServiceDescriptor<M: ManagedTypeApi> {
    pub id: ManagedBuffer<M>,
    pub name: ManagedBuffer<M>,
    pub category: ManagedBuffer<M>,       // e.g. "data-fetching"
    pub version: ManagedBuffer<M>,
    pub endpoint_hash: ManagedBuffer<M>,  // keccak256(endpoint_url) — URL stored off-chain
    pub metadata_hash: ManagedBuffer<M>,  // IPFS/Arweave CID hash
    pub pricing_model: ManagedBuffer<M>,  // "per-request" | "per-token" | "per-workflow" ...
    pub price_per_unit: BigUint<M>,       // in EGLD denomination (10^18)
    pub max_latency_ms: u64,
    pub uptime_guarantee: u64,            // basis points (9900 = 99.00%)
    pub ucp_compatible: bool,
    pub mcp_compatible: bool,
    pub provider: ManagedAddress<M>,
    pub stake: BigUint<M>,
    pub active: bool,
    pub registered_at: u64,               // block timestamp
    pub total_tasks: u64,
}

/// ─── Registry Contract ───────────────────────────────────────────────────────
#[multiversx_sc::contract]
pub trait AgentRegistry {
    #[init]
    fn init(&self, min_stake: BigUint, protocol_fee_bps: u64) {
        self.min_stake().set(&min_stake);
        self.protocol_fee_bps().set(protocol_fee_bps);
        self.owner().set(self.blockchain().get_caller());
    }

    // ── Register ─────────────────────────────────────────────────────────────
    #[payable("EGLD")]
    #[endpoint(registerService)]
    fn register_service(
        &self,
        service_id: ManagedBuffer,
        name: ManagedBuffer,
        category: ManagedBuffer,
        version: ManagedBuffer,
        endpoint_hash: ManagedBuffer,
        metadata_hash: ManagedBuffer,
        pricing_model: ManagedBuffer,
        price_per_unit: BigUint,
        max_latency_ms: u64,
        uptime_guarantee: u64,
        ucp_compatible: bool,
        mcp_compatible: bool,
    ) {
        let stake = self.call_value().egld_value().clone_value();
        require!(stake >= self.min_stake().get(), "Stake below minimum");
        require!(!self.services().contains_key(&service_id), "Service ID already registered");
        require!(uptime_guarantee <= 10_000, "Uptime guarantee max 10000 bps");

        let caller = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp();

        let descriptor = ServiceDescriptor {
            id: service_id.clone(),
            name,
            category: category.clone(),
            version,
            endpoint_hash,
            metadata_hash,
            pricing_model,
            price_per_unit,
            max_latency_ms,
            uptime_guarantee,
            ucp_compatible,
            mcp_compatible,
            provider: caller.clone(),
            stake: stake.clone(),
            active: true,
            registered_at: now,
            total_tasks: 0,
        };

        self.services().insert(service_id.clone(), descriptor);
        self.provider_services(&caller).insert(service_id.clone());
        self.category_services(&category).insert(service_id.clone());
        self.total_staked().update(|v| *v += &stake);

        self.service_registered_event(&service_id, &caller, &stake, now);
    }

    // ── Update ───────────────────────────────────────────────────────────────
    #[endpoint(updateService)]
    fn update_service(
        &self,
        service_id: ManagedBuffer,
        new_price: BigUint,
        new_max_latency_ms: u64,
        new_metadata_hash: ManagedBuffer,
    ) {
        let caller = self.blockchain().get_caller();
        let mut svc = self.services().get(&service_id).unwrap_or_else(|| sc_panic!("Not found"));
        require!(svc.provider == caller, "Not the provider");
        svc.price_per_unit = new_price;
        svc.max_latency_ms = new_max_latency_ms;
        svc.metadata_hash = new_metadata_hash;
        self.services().insert(service_id.clone(), svc);
        self.service_updated_event(&service_id);
    }

    // ── Deactivate ───────────────────────────────────────────────────────────
    #[endpoint(deactivateService)]
    fn deactivate_service(&self, service_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut svc = self.services().get(&service_id).unwrap_or_else(|| sc_panic!("Not found"));
        require!(svc.provider == caller || caller == self.owner().get(), "Unauthorized");
        svc.active = false;
        self.services().insert(service_id.clone(), svc);
        self.service_deactivated_event(&service_id);
    }

    // ── Withdraw stake ───────────────────────────────────────────────────────
    #[endpoint(withdrawStake)]
    fn withdraw_stake(&self, service_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let svc = self.services().get(&service_id).unwrap_or_else(|| sc_panic!("Not found"));
        require!(svc.provider == caller, "Not the provider");
        require!(!svc.active, "Deactivate first");
        let stake = svc.stake.clone();
        self.total_staked().update(|v| *v -= &stake);
        self.send().direct_egld(&caller, &stake);
        self.services().remove(&service_id);
        self.stake_withdrawn_event(&service_id, &stake);
    }

    // ── Increment task count (callable by Escrow contract) ───────────────────
    #[endpoint(incrementTaskCount)]
    fn increment_task_count(&self, service_id: ManagedBuffer) {
        require!(self.escrow_contract().get() == self.blockchain().get_caller(), "Only escrow");
        if let Some(mut svc) = self.services().get(&service_id) {
            svc.total_tasks += 1;
            self.services().insert(service_id, svc);
        }
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    #[view(getService)]
    fn get_service(&self, service_id: ManagedBuffer) -> OptionalValue<ServiceDescriptor<Self::Api>> {
        OptionalValue::from(self.services().get(&service_id))
    }

    #[view(getServicesByCategory)]
    fn get_services_by_category(&self, category: ManagedBuffer) -> MultiValueEncoded<ManagedBuffer> {
        let mut out = MultiValueEncoded::new();
        for id in self.category_services(&category).iter() { out.push(id); }
        out
    }

    #[view(getProviderServices)]
    fn get_provider_services(&self, provider: ManagedAddress) -> MultiValueEncoded<ManagedBuffer> {
        let mut out = MultiValueEncoded::new();
        for id in self.provider_services(&provider).iter() { out.push(id); }
        out
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    #[only_owner]
    #[endpoint(setEscrowContract)]
    fn set_escrow_contract(&self, addr: ManagedAddress) { self.escrow_contract().set(addr); }

    #[only_owner]
    #[endpoint(setMinStake)]
    fn set_min_stake(&self, amount: BigUint) { self.min_stake().set(&amount); }

    // ── Storage ───────────────────────────────────────────────────────────────
    #[storage_mapper("services")]
    fn services(&self) -> MapMapper<ManagedBuffer, ServiceDescriptor<Self::Api>>;

    #[storage_mapper("providerServices")]
    fn provider_services(&self, provider: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("categoryServices")]
    fn category_services(&self, category: &ManagedBuffer) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("minStake")]
    fn min_stake(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("protocolFeeBps")]
    fn protocol_fee_bps(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("totalStaked")]
    fn total_staked(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("escrowContract")]
    fn escrow_contract(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    // ── Events ────────────────────────────────────────────────────────────────
    #[event("serviceRegistered")]
    fn service_registered_event(&self, #[indexed] id: &ManagedBuffer, #[indexed] provider: &ManagedAddress, stake: &BigUint, timestamp: u64);

    #[event("serviceUpdated")]
    fn service_updated_event(&self, #[indexed] id: &ManagedBuffer);

    #[event("serviceDeactivated")]
    fn service_deactivated_event(&self, #[indexed] id: &ManagedBuffer);

    #[event("stakeWithdrawn")]
    fn stake_withdrawn_event(&self, #[indexed] id: &ManagedBuffer, amount: &BigUint);
}
