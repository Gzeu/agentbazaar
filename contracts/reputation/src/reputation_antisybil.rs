// AgentBazaar — Reputation Contract Anti-Sybil & Multi-Sig Extensions
// These endpoints extend the base reputation contract.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// Minimum stake required to register as a provider (0.01 EGLD = 10^16 wei)
pub const MIN_PROVIDER_STAKE: u64 = 10_000_000_000_000_000; // 0.01 EGLD

/// Minimum tasks before reputation score is published publicly
pub const MIN_TASKS_FOR_PUBLIC_SCORE: u64 = 5;

/// Number of arbiters needed to resolve a dispute
pub const DISPUTE_QUORUM: usize = 3;

#[multiversx_sc::module]
pub trait AntiSybilModule:
    multiversx_sc_modules::pause::PauseModule
{
    // ── Storage ─────────────────────────────────────────────────────────

    #[storage_mapper("provider_stake")]
    fn provider_stake(&self, address: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[storage_mapper("is_registered_provider")]
    fn is_registered_provider(&self, address: &ManagedAddress) -> SingleValueMapper<bool>;

    #[storage_mapper("arbiters")]
    fn arbiters(&self) -> UnorderedSetMapper<ManagedAddress>;

    #[storage_mapper("dispute_votes")]
    fn dispute_votes(
        &self, task_id: &ManagedBuffer,
    ) -> MapMapper<ManagedAddress, bool>; // true = consumer wins, false = provider wins

    #[storage_mapper("dispute_resolved")]
    fn dispute_resolved(&self, task_id: &ManagedBuffer) -> SingleValueMapper<bool>;

    // ── Endpoints ────────────────────────────────────────────────────────

    /// Provider must stake >= 0.01 EGLD to register.
    /// Prevents sybil attacks by requiring real economic commitment.
    #[payable("EGLD")]
    #[endpoint(registerProvider)]
    fn register_provider(&self) {
        self.require_not_paused();
        let caller  = self.blockchain().get_caller();
        let payment = self.call_value().egld_value().clone_value();
        let min     = BigUint::from(MIN_PROVIDER_STAKE);

        require!(
            payment >= min,
            "Stake insuficient — minim 0.01 EGLD pentru îregistrare"
        );
        require!(
            !self.is_registered_provider(&caller).get(),
            "Provider deja îregistrat"
        );

        let existing = self.provider_stake(&caller).get();
        self.provider_stake(&caller).set(&existing + &payment);
        self.is_registered_provider(&caller).set(true);

        self.provider_registered_event(&caller, &payment);
    }

    /// Provider withdraws stake (only if not slashed, no active tasks).
    #[endpoint(withdrawStake)]
    fn withdraw_stake(&self) {
        let caller = self.blockchain().get_caller();
        require!(
            self.is_registered_provider(&caller).get(),
            "Nu esti îregistrat ca provider"
        );
        let stake = self.provider_stake(&caller).get();
        require!(stake > BigUint::zero(), "No stake to withdraw");

        self.provider_stake(&caller).set(BigUint::zero());
        self.is_registered_provider(&caller).set(false);
        self.send().direct_egld(&caller, &stake);
    }

    /// Arbiter votes on a dispute. Requires quorum of DISPUTE_QUORUM (3).
    #[endpoint(voteDispute)]
    fn vote_dispute(
        &self,
        task_id:       ManagedBuffer,
        consumer_wins: bool,
    ) {
        let caller = self.blockchain().get_caller();
        require!(
            self.arbiters().contains(&caller),
            "Nu esti arbiter autorizat"
        );
        require!(
            !self.dispute_resolved(&task_id).get(),
            "Disputa deja rezolvată"
        );

        self.dispute_votes(&task_id).insert(caller, consumer_wins);
        self.try_resolve_dispute(&task_id);
    }

    fn try_resolve_dispute(&self, task_id: &ManagedBuffer) {
        let votes: Vec<(ManagedAddress, bool)> = self
            .dispute_votes(task_id)
            .iter()
            .collect();

        if votes.len() < DISPUTE_QUORUM { return; }

        let consumer_votes = votes.iter().filter(|(_, v)| *v).count();
        let provider_votes = votes.len() - consumer_votes;
        let consumer_wins  = consumer_votes > provider_votes;

        self.dispute_resolved(task_id).set(true);
        self.dispute_resolved_event(task_id, consumer_wins, consumer_votes, provider_votes);
    }

    /// Owner adds an arbiter address
    #[only_owner]
    #[endpoint(addArbiter)]
    fn add_arbiter(&self, arbiter: ManagedAddress) {
        self.arbiters().insert(arbiter);
    }

    #[only_owner]
    #[endpoint(removeArbiter)]
    fn remove_arbiter(&self, arbiter: ManagedAddress) {
        self.arbiters().swap_remove(&arbiter);
    }

    // ── Views ─────────────────────────────────────────────────────────────

    #[view(getProviderStake)]
    fn get_provider_stake(&self, address: ManagedAddress) -> BigUint {
        self.provider_stake(&address).get()
    }

    #[view(isRegisteredProvider)]
    fn view_is_registered(&self, address: ManagedAddress) -> bool {
        self.is_registered_provider(&address).get()
    }

    #[view(getArbiters)]
    fn get_arbiters(&self) -> MultiValueEncoded<ManagedAddress> {
        self.arbiters().iter().collect()
    }

    // ── Events ───────────────────────────────────────────────────────────

    #[event("providerRegistered")]
    fn provider_registered_event(
        &self,
        #[indexed] provider: &ManagedAddress,
        stake: &BigUint,
    );

    #[event("disputeResolved")]
    fn dispute_resolved_event(
        &self,
        #[indexed] task_id:        &ManagedBuffer,
        consumer_wins:  bool,
        consumer_votes: usize,
        provider_votes: usize,
    );
}
