#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct Proposal<M: ManagedTypeApi> {
    pub id: u64,
    pub proposer: ManagedAddress<M>,
    pub description: ManagedBuffer<M>,
    pub yes_votes: BigUint<M>,
    pub no_votes: BigUint<M>,
    pub executed: bool,
    pub created_at: u64,
    pub execute_after: u64,
}

#[multiversx_sc::contract]
pub trait AgentBazaarDAO {
    #[init]
    fn init(&self, bazaar_token_id: TokenIdentifier, quorum_bps: u64, vote_duration: u64, exec_delay: u64) {
        self.bazaar_token_id().set(&bazaar_token_id);
        self.quorum_bps().set(quorum_bps);
        self.vote_duration().set(vote_duration);
        self.exec_delay().set(exec_delay);
        self.proposal_count().set(0u64);
    }

    fn now_u64(&self) -> u64 {
        self.blockchain().get_block_timestamp_seconds().0
    }

    #[payable("EGLD")]
    #[endpoint(depositFee)]
    fn deposit_fee(&self) {
        let amount = self.call_value().egld().clone_value();
        let current = self.treasury_balance().get();
        self.treasury_balance().set(current + amount);
    }

    #[endpoint(withdrawTreasury)]
    fn withdraw_treasury(&self, _proposal_id: u64, to: ManagedAddress, amount: BigUint) {
        self.require_owner();
        let balance = self.treasury_balance().get();
        require!(balance >= amount, "Insufficient treasury");
        self.treasury_balance().set(balance - amount.clone());
        self.send().direct_egld(&to, &amount);
    }

    #[endpoint(createProposal)]
    fn create_proposal(&self, description: ManagedBuffer) -> u64 {
        let id = self.proposal_count().get() + 1;
        let now = self.now_u64();
        let proposal = Proposal {
            id, proposer: self.blockchain().get_caller(), description,
            yes_votes: BigUint::zero(), no_votes: BigUint::zero(), executed: false,
            created_at: now,
            execute_after: now + self.vote_duration().get() + self.exec_delay().get(),
        };
        self.proposals(id).set(proposal);
        self.proposal_count().set(id);
        self.proposal_created_event(id);
        id
    }

    #[endpoint(vote)]
    fn vote(&self, proposal_id: u64, in_favor: bool) {
        let caller = self.blockchain().get_caller();
        require!(!self.has_voted(proposal_id, &caller).get(), "Already voted");
        let voting_power = self.voting_power(&caller).get();
        require!(voting_power > BigUint::zero(), "No voting power");
        let mut proposal = self.proposals(proposal_id).get();
        let now = self.now_u64();
        require!(now < proposal.created_at + self.vote_duration().get(), "Voting closed");
        if in_favor { proposal.yes_votes += voting_power; } else { proposal.no_votes += voting_power; }
        self.proposals(proposal_id).set(proposal);
        self.has_voted(proposal_id, &caller).set(true);
    }

    #[view(getTreasuryBalance)]
    fn get_treasury_balance(&self) -> BigUint { self.treasury_balance().get() }
    #[view(getProposal)]
    fn get_proposal(&self, id: u64) -> Proposal<Self::Api> { self.proposals(id).get() }
    #[view(getProposalCount)]
    fn get_proposal_count(&self) -> u64 { self.proposal_count().get() }

    #[storage_mapper("bazaarTokenId")]
    fn bazaar_token_id(&self) -> SingleValueMapper<TokenIdentifier>;
    #[storage_mapper("quorumBps")]
    fn quorum_bps(&self) -> SingleValueMapper<u64>;
    #[storage_mapper("voteDuration")]
    fn vote_duration(&self) -> SingleValueMapper<u64>;
    #[storage_mapper("execDelay")]
    fn exec_delay(&self) -> SingleValueMapper<u64>;
    #[storage_mapper("treasuryBalance")]
    fn treasury_balance(&self) -> SingleValueMapper<BigUint>;
    #[storage_mapper("proposalCount")]
    fn proposal_count(&self) -> SingleValueMapper<u64>;
    #[storage_mapper("proposals")]
    fn proposals(&self, id: u64) -> SingleValueMapper<Proposal<Self::Api>>;
    #[storage_mapper("hasVoted")]
    fn has_voted(&self, proposal_id: u64, address: &ManagedAddress) -> SingleValueMapper<bool>;
    #[storage_mapper("votingPower")]
    fn voting_power(&self, address: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[event("proposalCreated")]
    fn proposal_created_event(&self, #[indexed] proposal_id: u64);

    fn require_owner(&self) {
        require!(self.blockchain().get_caller() == self.blockchain().get_owner_address(), "Owner only");
    }
}
