#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// ─── Task States ─────────────────────────────────────────────────────────────
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone)]
pub enum TaskState {
    Pending,
    Paid,
    Running,
    Completed,
    Failed,
    Disputed,
    Refunded,
}

/// ─── Task Record ─────────────────────────────────────────────────────────────
#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, ManagedVecItem, Clone)]
pub struct TaskRecord<M: ManagedTypeApi> {
    pub task_id: ManagedBuffer<M>,
    pub service_id: ManagedBuffer<M>,
    pub consumer: ManagedAddress<M>,
    pub provider: ManagedAddress<M>,
    pub amount: BigUint<M>,          // locked EGLD
    pub protocol_fee: BigUint<M>,    // platform fee deducted on release
    pub payload_hash: ManagedBuffer<M>,   // keccak256(payload)
    pub result_hash: ManagedBuffer<M>,    // submitted by provider on completion
    pub state: TaskState,
    pub created_at: u64,
    pub deadline: u64,
    pub mandate_id: ManagedBuffer<M>, // AP2 mandate reference
}

/// ─── Escrow Contract ─────────────────────────────────────────────────────────
#[multiversx_sc::contract]
pub trait AgentEscrow {
    #[init]
    fn init(
        &self,
        registry_address: ManagedAddress,
        reputation_address: ManagedAddress,
        protocol_fee_bps: u64,   // e.g. 100 = 1%
        dispute_window: u64,     // seconds after completion before auto-release
    ) {
        self.registry().set(&registry_address);
        self.reputation().set(&reputation_address);
        self.protocol_fee_bps().set(protocol_fee_bps);
        self.dispute_window().set(dispute_window);
        self.owner().set(self.blockchain().get_caller());
    }

    // ── Create Task + Lock Funds ──────────────────────────────────────────────
    #[payable("EGLD")]
    #[endpoint(createTask)]
    fn create_task(
        &self,
        task_id: ManagedBuffer,
        service_id: ManagedBuffer,
        provider: ManagedAddress,
        payload_hash: ManagedBuffer,
        deadline_offset_secs: u64,  // seconds from now
        mandate_id: ManagedBuffer,
    ) {
        let amount = self.call_value().egld_value().clone_value();
        require!(amount > BigUint::zero(), "Must send EGLD");
        require!(!self.tasks().contains_key(&task_id), "Task ID exists");

        let caller = self.blockchain().get_caller();
        let now = self.blockchain().get_block_timestamp();
        let fee_bps = self.protocol_fee_bps().get();
        let fee = &amount * fee_bps / 10_000u64;
        let net = &amount - &fee;

        let record = TaskRecord {
            task_id: task_id.clone(),
            service_id: service_id.clone(),
            consumer: caller.clone(),
            provider: provider.clone(),
            amount: net,
            protocol_fee: fee,
            payload_hash,
            result_hash: ManagedBuffer::new(),
            state: TaskState::Paid,
            created_at: now,
            deadline: now + deadline_offset_secs,
            mandate_id,
        };

        self.tasks().insert(task_id.clone(), record);
        self.consumer_tasks(&caller).insert(task_id.clone());
        self.provider_tasks(&provider).insert(task_id.clone());

        self.task_created_event(&task_id, &service_id, &caller, &provider, &amount, now + deadline_offset_secs);
    }

    // ── Provider marks task as running ────────────────────────────────────────
    #[endpoint(startTask)]
    fn start_task(&self, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut task = self.require_task(&task_id);
        require!(task.provider == caller, "Not the provider");
        require!(task.state == TaskState::Paid, "Invalid state");
        task.state = TaskState::Running;
        self.tasks().insert(task_id.clone(), task);
        self.task_state_changed_event(&task_id, 2u8); // 2 = Running
    }

    // ── Provider submits proof & requests payment ─────────────────────────────
    #[endpoint(completeTask)]
    fn complete_task(&self, task_id: ManagedBuffer, result_hash: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut task = self.require_task(&task_id);
        require!(task.provider == caller, "Not the provider");
        require!(task.state == TaskState::Running, "Invalid state");
        task.result_hash = result_hash;
        task.state = TaskState::Completed;
        self.tasks().insert(task_id.clone(), task.clone());
        self.task_completed_event(&task_id, &task.result_hash);
        // Auto-release after dispute_window (simplified: immediate for MVP)
        self.do_release(&task_id);
    }

    // ── Consumer triggers refund (timeout or failed) ──────────────────────────
    #[endpoint(refundTask)]
    fn refund_task(&self, task_id: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut task = self.require_task(&task_id);
        require!(task.consumer == caller, "Not the consumer");
        let now = self.blockchain().get_block_timestamp();
        require!(
            task.state == TaskState::Paid || (task.state == TaskState::Running && now > task.deadline),
            "Cannot refund yet"
        );
        let refund = task.amount.clone() + task.protocol_fee.clone();
        task.state = TaskState::Refunded;
        self.tasks().insert(task_id.clone(), task.clone());
        self.send().direct_egld(&caller, &refund);
        // Reputation penalty
        self.call_reputation_penalty(&task.provider, &task.service_id);
        self.task_refunded_event(&task_id, &refund);
    }

    // ── Internal: release payment to provider ─────────────────────────────────
    fn do_release(&self, task_id: &ManagedBuffer) {
        let task = self.require_task(task_id);
        self.send().direct_egld(&task.provider, &task.amount);
        // Collect protocol fee
        let treasury = self.treasury().get();
        if task.protocol_fee > BigUint::zero() {
            self.send().direct_egld(&treasury, &task.protocol_fee);
        }
        // Notify registry
        self.registry_proxy(self.registry().get())
            .increment_task_count(task.service_id.clone())
            .execute_on_dest_context::<()>();
        // Notify reputation
        self.call_reputation_success(&task.provider, &task.service_id);
        self.task_paid_out_event(task_id, &task.provider, &task.amount);
    }

    fn call_reputation_success(&self, provider: &ManagedAddress, service_id: &ManagedBuffer) {
        self.reputation_proxy(self.reputation().get())
            .record_success(provider.clone(), service_id.clone())
            .execute_on_dest_context::<()>();
    }

    fn call_reputation_penalty(&self, provider: &ManagedAddress, service_id: &ManagedBuffer) {
        self.reputation_proxy(self.reputation().get())
            .record_failure(provider.clone(), service_id.clone())
            .execute_on_dest_context::<()>();
    }

    fn require_task(&self, task_id: &ManagedBuffer) -> TaskRecord<Self::Api> {
        self.tasks().get(task_id).unwrap_or_else(|| sc_panic!("Task not found"))
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    #[view(getTask)]
    fn get_task(&self, task_id: ManagedBuffer) -> OptionalValue<TaskRecord<Self::Api>> {
        OptionalValue::from(self.tasks().get(&task_id))
    }

    #[view(getConsumerTasks)]
    fn get_consumer_tasks(&self, consumer: ManagedAddress) -> MultiValueEncoded<ManagedBuffer> {
        let mut out = MultiValueEncoded::new();
        for id in self.consumer_tasks(&consumer).iter() { out.push(id); }
        out
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    #[only_owner]
    #[endpoint(setTreasury)]
    fn set_treasury(&self, addr: ManagedAddress) { self.treasury().set(addr); }

    // ── Proxies ───────────────────────────────────────────────────────────────
    #[proxy]
    fn registry_proxy(&self, addr: ManagedAddress) -> registry_proxy::Proxy<Self::Api>;

    #[proxy]
    fn reputation_proxy(&self, addr: ManagedAddress) -> reputation_proxy::Proxy<Self::Api>;

    // ── Storage ───────────────────────────────────────────────────────────────
    #[storage_mapper("tasks")]
    fn tasks(&self) -> MapMapper<ManagedBuffer, TaskRecord<Self::Api>>;

    #[storage_mapper("consumerTasks")]
    fn consumer_tasks(&self, c: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("providerTasks")]
    fn provider_tasks(&self, p: &ManagedAddress) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("registry")]
    fn registry(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("reputation")]
    fn reputation(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("treasury")]
    fn treasury(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("protocolFeeBps")]
    fn protocol_fee_bps(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("disputeWindow")]
    fn dispute_window(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    // ── Events ────────────────────────────────────────────────────────────────
    #[event("taskCreated")]
    fn task_created_event(&self, #[indexed] id: &ManagedBuffer, #[indexed] service: &ManagedBuffer, consumer: &ManagedAddress, provider: &ManagedAddress, amount: &BigUint, deadline: u64);

    #[event("taskStateChanged")]
    fn task_state_changed_event(&self, #[indexed] id: &ManagedBuffer, state: u8);

    #[event("taskCompleted")]
    fn task_completed_event(&self, #[indexed] id: &ManagedBuffer, result_hash: &ManagedBuffer);

    #[event("taskRefunded")]
    fn task_refunded_event(&self, #[indexed] id: &ManagedBuffer, amount: &BigUint);

    #[event("taskPaidOut")]
    fn task_paid_out_event(&self, #[indexed] id: &ManagedBuffer, provider: &ManagedAddress, amount: &BigUint);
}

mod registry_proxy {
    multiversx_sc::imports!();
    #[multiversx_sc::proxy]
    pub trait RegistryProxy {
        #[endpoint(incrementTaskCount)]
        fn increment_task_count(&self, service_id: ManagedBuffer);
    }
}

mod reputation_proxy {
    multiversx_sc::imports!();
    #[multiversx_sc::proxy]
    pub trait ReputationProxy {
        #[endpoint(recordSuccess)]
        fn record_success(&self, provider: ManagedAddress, service_id: ManagedBuffer);
        #[endpoint(recordFailure)]
        fn record_failure(&self, provider: ManagedAddress, service_id: ManagedBuffer);
    }
}
