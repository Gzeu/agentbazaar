#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub mod events;
pub mod storage;
pub mod views;

/// Minimum stake amounts per category (in EGLD denomination: 1e18)
/// Categories: 0=data-fetching, 1=compute-offload, 2=wallet-actions,
///             3=compliance, 4=enrichment, 5=orchestration, 6=notifications
const MIN_STAKE_EGLD: u64 = 5_000_000_000_000_000_000; // 5 EGLD

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct ServiceEntry<M: ManagedTypeApi> {
    pub service_id: ManagedBuffer<M>,
    pub provider: ManagedAddress<M>,
    pub descriptor_hash: ManagedBuffer<M>, // IPFS/Arweave CID
    pub category: u8,
    pub price_per_request: BigUint<M>,     // in smallest EGLD denomination
    pub stake: BigUint<M>,
    pub reputation_score: u64,             // 0-10000 (basis points)
    pub active: bool,
    pub registered_at: u64,
    pub total_tasks: u64,
}

#[multiversx_sc::contract]
pub trait RegistryContract:
    storage::StorageModule
    + views::ViewsModule
    + events::EventsModule
{
    #[init]
    fn init(&self, min_stake: BigUint) {
        self.min_stake().set(&min_stake);
        self.service_count().set(0u64);
    }

    #[upgrade]
    fn upgrade(&self) {}

    // -------------------------------------------------------------------------
    // WRITE ENDPOINTS
    // -------------------------------------------------------------------------

    /// Register a new service. Requires EGLD stake >= min_stake.
    #[payable("EGLD")]
    #[endpoint(registerService)]
    fn register_service(
        &self,
        service_id: ManagedBuffer,
        descriptor_hash: ManagedBuffer, // IPFS CID of the ServiceDescriptor JSON
        category: u8,
        price_per_request: BigUint,
    ) {
        let caller = self.blockchain().get_caller();
        let stake = self.call_value().egld_value().clone_value();

        require!(
            stake >= self.min_stake().get(),
            "Stake below minimum required"
        );
        require!(
            !self.service_by_id(&service_id).is_empty(),
            "Service ID already registered"
        );
        require!(category <= 6, "Invalid category");
        require!(
            descriptor_hash.len() > 0,
            "Descriptor hash cannot be empty"
        );

        let now = self.blockchain().get_block_timestamp();

        let entry = ServiceEntry {
            service_id: service_id.clone(),
            provider: caller.clone(),
            descriptor_hash: descriptor_hash.clone(),
            category,
            price_per_request: price_per_request.clone(),
            stake: stake.clone(),
            reputation_score: 5000u64, // Start at 50%
            active: true,
            registered_at: now,
            total_tasks: 0u64,
        };

        self.service_by_id(&service_id).set(&entry);
        self.services_by_provider(&caller)
            .insert(service_id.clone());
        self.services_by_category(category)
            .insert(service_id.clone());

        let count = self.service_count().get() + 1;
        self.service_count().set(count);

        self.service_registered_event(
            &caller,
            &service_id,
            &descriptor_hash,
            category,
            &price_per_request,
            &stake,
        );
    }

    /// Update service descriptor and/or pricing
    #[endpoint(updateService)]
    fn update_service(
        &self,
        service_id: ManagedBuffer,
        descriptor_hash: ManagedBuffer,
        price_per_request: BigUint,
    ) {
        let caller = self.blockchain().get_caller();
        require!(
            !self.service_by_id(&service_id).is_empty(),
            "Service not found"
        );

        let mut entry = self.service_by_id(&service_id).get();
        require!(entry.provider == caller, "Only provider can update");
        require!(entry.active, "Service is deactivated");

        entry.descriptor_hash = descriptor_hash;
        entry.price_per_request = price_per_request;
        self.service_by_id(&service_id).set(&entry);

        self.service_updated_event(&caller, &service_id);
    }

    /// Deregister service and return stake
    #[endpoint(deregisterService)]
    fn deregister_service(&self, service_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        require!(
            !self.service_by_id(&service_id).is_empty(),
            "Service not found"
        );

        let entry = self.service_by_id(&service_id).get();
        require!(entry.provider == caller, "Only provider can deregister");

        let stake = entry.stake.clone();

        self.services_by_provider(&caller)
            .remove(&service_id);
        self.services_by_category(entry.category)
            .remove(&service_id);
        self.service_by_id(&service_id).clear();

        let count = self.service_count().get().saturating_sub(1);
        self.service_count().set(count);

        // Return stake
        self.send().direct_egld(&caller, &stake);

        self.service_deregistered_event(&caller, &service_id);
    }

    /// Called by Reputation contract to update score
    #[endpoint(updateReputationScore)]
    fn update_reputation_score(
        &self,
        service_id: ManagedBuffer,
        new_score: u64,
        delta_tasks: u64,
    ) {
        // Only the reputation contract can call this
        let reputation_addr = self.reputation_contract_address().get();
        require!(
            self.blockchain().get_caller() == reputation_addr,
            "Unauthorized: only reputation contract"
        );
        require!(new_score <= 10000, "Score must be in basis points 0-10000");

        if !self.service_by_id(&service_id).is_empty() {
            let mut entry = self.service_by_id(&service_id).get();
            entry.reputation_score = new_score;
            entry.total_tasks += delta_tasks;
            self.service_by_id(&service_id).set(&entry);
        }
    }

    /// Owner: set the address of the Reputation contract
    #[only_owner]
    #[endpoint(setReputationContract)]
    fn set_reputation_contract(&self, address: ManagedAddress) {
        self.reputation_contract_address().set(&address);
    }

    /// Owner: set minimum stake
    #[only_owner]
    #[endpoint(setMinStake)]
    fn set_min_stake(&self, new_min: BigUint) {
        self.min_stake().set(&new_min);
    }
}
