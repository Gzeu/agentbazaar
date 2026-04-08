#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

pub mod events;
pub mod storage;
pub mod views;

const DISPUTE_WINDOW_SECONDS: u64 = 3600; // 1 hour

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone, PartialEq)]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Disputed,
    Refunded,
}

#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi, Clone)]
pub struct EscrowEntry<M: ManagedTypeApi> {
    pub task_id: ManagedBuffer<M>,
    pub consumer: ManagedAddress<M>,
    pub provider: ManagedAddress<M>,
    pub service_id: ManagedBuffer<M>,
    pub amount: BigUint<M>,
    pub status: TaskStatus,
    pub created_at: u64,
    pub completed_at: u64,
    pub proof_hash: ManagedBuffer<M>,
    pub deadline: u64,
}

#[multiversx_sc::contract]
pub trait EscrowContract:
    storage::StorageModule
    + views::ViewsModule
    + events::EventsModule
{
    #[init]
    fn init(&self, marketplace_fee_bps: u64, fee_collector: ManagedAddress) {
        // marketplace_fee_bps: e.g. 100 = 1%
        self.marketplace_fee_bps().set(marketplace_fee_bps);
        self.fee_collector().set(&fee_collector);
    }

    #[upgrade]
    fn upgrade(&self) {}

    // -------------------------------------------------------------------------
    // WRITE ENDPOINTS
    // -------------------------------------------------------------------------

    /// Consumer locks funds for a task. Returns task_id.
    #[payable("EGLD")]
    #[endpoint(createEscrow)]
    fn create_escrow(
        &self,
        task_id: ManagedBuffer,
        provider: ManagedAddress,
        service_id: ManagedBuffer,
        deadline_seconds: u64,
    ) {
        let caller = self.blockchain().get_caller();
        let amount = self.call_value().egld_value().clone_value();
        let now = self.blockchain().get_block_timestamp();

        require!(amount > BigUint::zero(), "Amount must be > 0");
        require!(
            self.escrow_by_task_id(&task_id).is_empty(),
            "Task ID already exists"
        );

        let entry = EscrowEntry {
            task_id: task_id.clone(),
            consumer: caller.clone(),
            provider: provider.clone(),
            service_id: service_id.clone(),
            amount: amount.clone(),
            status: TaskStatus::Pending,
            created_at: now,
            completed_at: 0u64,
            proof_hash: ManagedBuffer::new(),
            deadline: now + deadline_seconds,
        };

        self.escrow_by_task_id(&task_id).set(&entry);
        self.tasks_by_consumer(&caller).insert(task_id.clone());
        self.tasks_by_provider(&provider).insert(task_id.clone());

        self.escrow_created_event(&caller, &provider, &task_id, &service_id, &amount);
    }

    /// Provider submits proof and requests release
    #[endpoint(submitProof)]
    fn submit_proof(&self, task_id: ManagedBuffer, proof_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        require!(
            !self.escrow_by_task_id(&task_id).is_empty(),
            "Task not found"
        );

        let mut entry = self.escrow_by_task_id(&task_id).get();
        require!(entry.provider == caller, "Only provider can submit proof");
        require!(entry.status == TaskStatus::Pending || entry.status == TaskStatus::Running, "Invalid status");

        let now = self.blockchain().get_block_timestamp();
        entry.status = TaskStatus::Completed;
        entry.completed_at = now;
        entry.proof_hash = proof_hash.clone();
        self.escrow_by_task_id(&task_id).set(&entry);

        self.proof_submitted_event(&caller, &task_id, &proof_hash);
    }

    /// Release funds to provider after proof is accepted
    #[endpoint(releaseEscrow)]
    fn release_escrow(&self, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        require!(
            !self.escrow_by_task_id(&task_id).is_empty(),
            "Task not found"
        );

        let mut entry = self.escrow_by_task_id(&task_id).get();
        // Consumer or contract owner can release after proof
        require!(
            entry.consumer == caller || self.blockchain().get_owner_address() == caller,
            "Unauthorized"
        );
        require!(entry.status == TaskStatus::Completed, "Task not completed");

        let fee_bps = self.marketplace_fee_bps().get();
        let fee = &entry.amount * fee_bps / 10_000u64;
        let provider_amount = &entry.amount - &fee;

        self.send().direct_egld(&entry.provider, &provider_amount);
        if fee > BigUint::zero() {
            let collector = self.fee_collector().get();
            self.send().direct_egld(&collector, &fee);
        }

        entry.status = TaskStatus::Refunded; // reuse as "settled"
        self.escrow_by_task_id(&task_id).set(&entry);

        self.escrow_released_event(&entry.provider, &task_id, &provider_amount, &fee);
    }

    /// Consumer requests refund (after deadline or failed task)
    #[endpoint(refundEscrow)]
    fn refund_escrow(&self, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        require!(
            !self.escrow_by_task_id(&task_id).is_empty(),
            "Task not found"
        );

        let mut entry = self.escrow_by_task_id(&task_id).get();
        require!(entry.consumer == caller, "Only consumer can refund");
        require!(
            entry.status == TaskStatus::Pending || entry.status == TaskStatus::Running,
            "Cannot refund at this stage"
        );

        let now = self.blockchain().get_block_timestamp();
        require!(now > entry.deadline, "Deadline not reached yet");

        let amount = entry.amount.clone();
        entry.status = TaskStatus::Refunded;
        self.escrow_by_task_id(&task_id).set(&entry);

        self.send().direct_egld(&caller, &amount);
        self.escrow_refunded_event(&caller, &task_id, &amount);
    }

    /// Raise a dispute (consumer only, within dispute window)
    #[endpoint(raiseDispute)]
    fn raise_dispute(&self, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        require!(
            !self.escrow_by_task_id(&task_id).is_empty(),
            "Task not found"
        );

        let mut entry = self.escrow_by_task_id(&task_id).get();
        require!(entry.consumer == caller, "Only consumer can raise dispute");
        require!(entry.status == TaskStatus::Completed, "Can only dispute completed tasks");

        let now = self.blockchain().get_block_timestamp();
        require!(
            now <= entry.completed_at + DISPUTE_WINDOW_SECONDS,
            "Dispute window expired"
        );

        entry.status = TaskStatus::Disputed;
        self.escrow_by_task_id(&task_id).set(&entry);

        self.dispute_raised_event(&caller, &task_id);
    }

    /// Owner resolves dispute: true = release to provider, false = refund to consumer
    #[only_owner]
    #[endpoint(resolveDispute)]
    fn resolve_dispute(&self, task_id: ManagedBuffer, favor_provider: bool) {
        require!(
            !self.escrow_by_task_id(&task_id).is_empty(),
            "Task not found"
        );

        let mut entry = self.escrow_by_task_id(&task_id).get();
        require!(entry.status == TaskStatus::Disputed, "Task not in dispute");

        let amount = entry.amount.clone();
        if favor_provider {
            let fee_bps = self.marketplace_fee_bps().get();
            let fee = &amount * fee_bps / 10_000u64;
            let provider_amount = &amount - &fee;
            self.send().direct_egld(&entry.provider, &provider_amount);
            if fee > BigUint::zero() {
                let collector = self.fee_collector().get();
                self.send().direct_egld(&collector, &fee);
            }
            entry.status = TaskStatus::Completed;
        } else {
            self.send().direct_egld(&entry.consumer, &amount);
            entry.status = TaskStatus::Refunded;
        }

        self.escrow_by_task_id(&task_id).set(&entry);
        self.dispute_resolved_event(&task_id, favor_provider);
    }

    #[only_owner]
    #[endpoint(setMarketplaceFee)]
    fn set_marketplace_fee(&self, fee_bps: u64) {
        require!(fee_bps <= 1000, "Max fee 10%");
        self.marketplace_fee_bps().set(fee_bps);
    }
}
