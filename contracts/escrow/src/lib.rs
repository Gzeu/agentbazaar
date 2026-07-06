#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

use multiversx_sc::types::{TimestampSeconds, DurationSeconds};

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone)]
#[type_abi]
pub enum TaskStatus { Pending, Completed, Refunded, Disputed }

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
#[type_abi]
pub struct TaskRecord<M: ManagedTypeApi> {
    pub buyer: ManagedAddress<M>,
    pub provider: ManagedAddress<M>,
    pub service_id: ManagedBuffer<M>,
    pub amount: BigUint<M>,
    pub status: TaskStatus,
    pub payload_hash: ManagedBuffer<M>,
    pub proof_hash: ManagedBuffer<M>,
    pub created_at: TimestampSeconds,
    pub completed_at: TimestampSeconds,
}

/// Multi-sig dispute vote record
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
#[type_abi]
pub struct DisputeVote<M: ManagedTypeApi> {
    pub task_id: ManagedBuffer<M>,
    pub votes_for_buyer: u64,
    pub votes_for_provider: u64,
    pub resolved: bool,
}

/// Timeout increased to 1800s (30 min) — suitable for AI tasks
pub const TASK_TIMEOUT: DurationSeconds = DurationSeconds::new(1800);
/// 1-hour window after completion to open a dispute
pub const DISPUTE_WINDOW: DurationSeconds = DurationSeconds::new(3600);
/// Multi-sig: requires 2 out of 3 arbiter votes to resolve
pub const ARBITER_THRESHOLD: u64 = 2;

#[multiversx_sc::contract]
pub trait EscrowContract {
    #[init]
    fn init(
        &self,
        registry_address: ManagedAddress,
        reputation_address: ManagedAddress,
        treasury_address: ManagedAddress,
        marketplace_fee_bps: u64,
    ) {
        self.registry_address().set(&registry_address);
        self.reputation_address().set(&reputation_address);
        self.treasury_address().set(&treasury_address);
        require!(marketplace_fee_bps <= 1000, "Fee too high (max 10%)");
        self.marketplace_fee_bps().set(marketplace_fee_bps);
        self.owner().set(self.blockchain().get_caller());
    }

    #[upgrade]
    fn upgrade(&self) {}

    // ── Storage ──────────────────────────────────────────────────────────
    #[storage_mapper("tasks")]
    fn tasks(&self) -> MapMapper<ManagedBuffer, TaskRecord<Self::Api>>;

    #[storage_mapper("registryAddress")]
    fn registry_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("reputationAddress")]
    fn reputation_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("treasuryAddress")]
    fn treasury_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("marketplaceFeeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    /// Set of approved arbiters (max 3)
    #[storage_mapper("arbiters")]
    fn arbiters(&self) -> UnorderedSetMapper<ManagedAddress>;

    /// dispute votes: task_id → DisputeVote
    #[storage_mapper("disputeVotes")]
    fn dispute_votes(&self, task_id: &ManagedBuffer) -> SingleValueMapper<DisputeVote<Self::Api>>;

    /// tracks which arbiters already voted: (task_id, arbiter) → bool
    #[storage_mapper("arbiterVoted")]
    fn arbiter_voted(&self, task_id: &ManagedBuffer, arbiter: &ManagedAddress) -> SingleValueMapper<bool>;

    // ── Events ───────────────────────────────────────────────────────────
    #[event("taskCreated")]
    fn emit_task_created(&self, #[indexed] task_id: &ManagedBuffer, #[indexed] buyer: &ManagedAddress, #[indexed] provider: &ManagedAddress);

    #[event("taskCompleted")]
    fn emit_task_completed(&self, #[indexed] task_id: &ManagedBuffer, #[indexed] provider: &ManagedAddress, proof_hash: &ManagedBuffer);

    #[event("taskRefunded")]
    fn emit_task_refunded(&self, #[indexed] task_id: &ManagedBuffer, #[indexed] buyer: &ManagedAddress);

    #[event("disputeOpened")]
    fn emit_dispute_opened(&self, #[indexed] task_id: &ManagedBuffer, #[indexed] opener: &ManagedAddress, reason: &ManagedBuffer);

    #[event("arbiterVoted")]
    fn emit_arbiter_voted(&self, #[indexed] task_id: &ManagedBuffer, #[indexed] arbiter: &ManagedAddress, for_buyer: bool);

    #[event("disputeResolved")]
    fn emit_dispute_resolved(&self, #[indexed] task_id: &ManagedBuffer, #[indexed] winner: &ManagedAddress);

    #[event("feeCollected")]
    fn emit_fee_collected(&self, #[indexed] task_id: &ManagedBuffer, fee_amount: &BigUint);

    fn now(&self) -> TimestampSeconds {
        self.blockchain().get_block_timestamp_seconds()
    }

    fn only_owner(&self) {
        require!(self.blockchain().get_caller() == self.owner().get(), "Not owner");
    }

    // ── Owner management ─────────────────────────────────────────────────

    /// Owner adds a trusted arbiter (max 3)
    #[endpoint(addArbiter)]
    fn add_arbiter(&self, arbiter: ManagedAddress) {
        self.only_owner();
        require!(self.arbiters().len() < 3, "Max 3 arbiters allowed");
        self.arbiters().insert(arbiter);
    }

    #[endpoint(removeArbiter)]
    fn remove_arbiter(&self, arbiter: ManagedAddress) {
        self.only_owner();
        self.arbiters().swap_remove(&arbiter);
    }

    #[endpoint(setMarketplaceFee)]
    fn set_marketplace_fee(&self, fee_bps: u64) {
        self.only_owner();
        require!(fee_bps <= 1000, "Fee too high (max 10%)");
        self.marketplace_fee_bps().set(fee_bps);
    }

    // ── Core endpoints ───────────────────────────────────────────────────

    #[payable("EGLD")]
    #[endpoint(createTask)]
    fn create_task(
        &self,
        task_id: ManagedBuffer,
        service_id: ManagedBuffer,
        provider: ManagedAddress,
        payload_hash: ManagedBuffer,
    ) {
        require!(!self.tasks().contains_key(&task_id), "Task ID already exists");
        let payment = self.call_value().egld().clone_value();
        require!(payment > BigUint::zero(), "Must attach EGLD payment");
        let caller = self.blockchain().get_caller();
        let record = TaskRecord {
            buyer: caller.clone(),
            provider: provider.clone(),
            service_id: service_id.clone(),
            amount: payment.clone(),
            status: TaskStatus::Pending,
            payload_hash: payload_hash.clone(),
            proof_hash: ManagedBuffer::new(),
            created_at: self.now(),
            completed_at: TimestampSeconds::zero(),
        };
        self.tasks().insert(task_id.clone(), record);
        self.emit_task_created(&task_id, &caller, &provider);
    }

    /// Provider completes task and receives payment minus marketplace fee.
    /// Fee is sent directly to the treasury address.
    #[endpoint(releaseEscrow)]
    fn release_escrow(&self, task_id: ManagedBuffer, proof_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id).unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.provider == caller, "Not task provider");
        require!(record.status == TaskStatus::Pending, "Task not in Pending state");

        let total = record.amount.clone();
        let fee_bps = self.marketplace_fee_bps().get();

        // Compute fee: floor(total * fee_bps / 10_000)
        let fee = total.clone() * fee_bps / 10_000u64;
        let provider_payout = total.clone() - fee.clone();

        record.status = TaskStatus::Completed;
        record.proof_hash = proof_hash.clone();
        record.completed_at = self.now();
        self.tasks().insert(task_id.clone(), record);

        // Pay provider net amount
        self.send().direct_egld(&caller, &provider_payout);

        // Send fee to treasury
        if fee > BigUint::zero() {
            self.send().direct_egld(&self.treasury_address().get(), &fee);
            self.emit_fee_collected(&task_id, &fee);
        }

        self.emit_task_completed(&task_id, &caller, &proof_hash);
    }

    /// Buyer can refund after TASK_TIMEOUT (1800s) if task is still Pending
    #[endpoint(refundTask)]
    fn refund_task(&self, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id).unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.buyer == caller, "Not task buyer");
        require!(record.status == TaskStatus::Pending, "Task not in Pending state");
        require!(self.now() >= record.created_at + TASK_TIMEOUT, "Task timeout not reached yet (30 min)");
        let amount = record.amount.clone();
        record.status = TaskStatus::Refunded;
        self.tasks().insert(task_id.clone(), record);
        self.send().direct_egld(&caller, &amount);
        self.emit_task_refunded(&task_id, &caller);
    }

    #[endpoint(openDispute)]
    fn open_dispute(&self, task_id: ManagedBuffer, reason: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut record = self.tasks().get(&task_id).unwrap_or_else(|| sc_panic!("Task not found"));
        require!(
            record.buyer == caller || record.provider == caller,
            "Not task participant"
        );
        require!(
            record.status == TaskStatus::Pending || record.status == TaskStatus::Completed,
            "Cannot dispute in current state"
        );
        if record.status == TaskStatus::Completed {
            require!(
                self.now() <= record.completed_at + DISPUTE_WINDOW,
                "Dispute window expired"
            );
        }
        record.status = TaskStatus::Disputed;
        self.tasks().insert(task_id.clone(), record.clone());

        // Initialize vote record
        let vote = DisputeVote {
            task_id: task_id.clone(),
            votes_for_buyer: 0,
            votes_for_provider: 0,
            resolved: false,
        };
        self.dispute_votes(&task_id).set(&vote);

        self.emit_dispute_opened(&task_id, &caller, &reason);
    }

    /// Multi-sig dispute resolution: any of the 3 arbiters can vote.
    /// When 2 votes (ARBITER_THRESHOLD) reach the same side, funds are released automatically.
    #[endpoint(voteDispute)]
    fn vote_dispute(&self, task_id: ManagedBuffer, for_buyer: bool) {
        let caller = self.blockchain().get_caller();
        require!(self.arbiters().contains(&caller), "Not an authorized arbiter");
        require!(
            !self.arbiter_voted(&task_id, &caller).get(),
            "Arbiter already voted"
        );

        let record = self.tasks().get(&task_id).unwrap_or_else(|| sc_panic!("Task not found"));
        require!(record.status == TaskStatus::Disputed, "Task not in Disputed state");

        let mut vote = self.dispute_votes(&task_id).get();
        require!(!vote.resolved, "Dispute already resolved");

        self.arbiter_voted(&task_id, &caller).set(true);
        self.emit_arbiter_voted(&task_id, &caller, for_buyer);

        if for_buyer {
            vote.votes_for_buyer += 1;
        } else {
            vote.votes_for_provider += 1;
        }

        if vote.votes_for_buyer >= ARBITER_THRESHOLD {
            vote.resolved = true;
            self.dispute_votes(&task_id).set(&vote);
            self.execute_dispute_resolution(&task_id, &record.buyer);
        } else if vote.votes_for_provider >= ARBITER_THRESHOLD {
            vote.resolved = true;
            self.dispute_votes(&task_id).set(&vote);
            self.execute_dispute_resolution(&task_id, &record.provider);
        } else {
            self.dispute_votes(&task_id).set(&vote);
        }
    }

    fn execute_dispute_resolution(&self, task_id: &ManagedBuffer, winner: &ManagedAddress) {
        let mut record = self.tasks().get(task_id).unwrap_or_else(|| sc_panic!("Task not found"));
        let amount = record.amount.clone();
        record.status = TaskStatus::Completed;
        self.tasks().insert(task_id.clone(), record);
        self.send().direct_egld(winner, &amount);
        self.emit_dispute_resolved(task_id, winner);
    }

    // ── Views ────────────────────────────────────────────────────────────

    #[view(getTask)]
    fn get_task(&self, task_id: ManagedBuffer) -> OptionalValue<TaskRecord<Self::Api>> {
        match self.tasks().get(&task_id) {
            Some(r) => OptionalValue::Some(r),
            None => OptionalValue::None,
        }
    }

    #[view(getDisputeVotes)]
    fn get_dispute_votes(&self, task_id: ManagedBuffer) -> OptionalValue<DisputeVote<Self::Api>> {
        if self.dispute_votes(&task_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.dispute_votes(&task_id).get())
        }
    }

    #[view(isArbiter)]
    fn is_arbiter(&self, address: ManagedAddress) -> bool {
        self.arbiters().contains(&address)
    }

    #[view(getMarketplaceFeeBps)]
    fn get_marketplace_fee_bps(&self) -> u64 { self.marketplace_fee_bps().get() }

    #[view(getTreasuryAddress)]
    fn get_treasury_address(&self) -> ManagedAddress { self.treasury_address().get() }
}
