use multiversx_sc_scenario::imports::*;

const ESCROW_ADDRESS: TestSCAddress = TestSCAddress::new("escrow");
const REGISTRY_ADDRESS: TestSCAddress = TestSCAddress::new("registry");
const REPUTATION_ADDRESS: TestSCAddress = TestSCAddress::new("reputation");
const PROVIDER: TestAddress = TestAddress::new("provider");
const BUYER: TestAddress = TestAddress::new("buyer");
const OWNER: TestAddress = TestAddress::new("owner");

mod escrow_proxy {
    multiversx_sc::imports!();
    #[multiversx_sc::proxy]
    pub trait EscrowProxy {
        #[init]
        fn init(&self, registry_address: ManagedAddress, reputation_address: ManagedAddress);

        #[payable("EGLD")]
        #[endpoint(createTask)]
        fn create_task(
            &self,
            task_id: ManagedBuffer,
            service_id: ManagedBuffer,
            provider: ManagedAddress,
            payload_hash: ManagedBuffer,
        );

        #[endpoint(releaseEscrow)]
        fn release_escrow(&self, task_id: ManagedBuffer, proof_hash: ManagedBuffer);

        #[endpoint(refundTask)]
        fn refund_task(&self, task_id: ManagedBuffer);

        #[endpoint(openDispute)]
        fn open_dispute(&self, task_id: ManagedBuffer, reason: ManagedBuffer);

        #[view(taskExists)]
        fn task_exists(&self, task_id: ManagedBuffer) -> bool;
    }
}

fn world() -> ScenarioWorld {
    let mut world = ScenarioWorld::new();
    world.register_contract("mxsc:output/escrow.mxsc.json", escrow::ContractBuilder);
    world
}

#[test]
fn test_create_and_release_task() {
    let mut world = world();
    world.account(BUYER).nonce(1).balance(1_000_000_000_000_000_000u64);
    world.account(PROVIDER).nonce(1).balance(0u64);

    world
        .tx()
        .from(OWNER)
        .typed(escrow_proxy::EscrowProxyMethods)
        .init(
            ManagedAddress::from(REGISTRY_ADDRESS.eval_to_array()),
            ManagedAddress::from(REPUTATION_ADDRESS.eval_to_array()),
        )
        .code("mxsc:output/escrow.mxsc.json")
        .new_address(ESCROW_ADDRESS)
        .run();

    world
        .tx()
        .from(BUYER)
        .to(ESCROW_ADDRESS)
        .typed(escrow_proxy::EscrowProxyMethods)
        .create_task(
            ManagedBuffer::from(b"task-001"),
            ManagedBuffer::from(b"svc-001"),
            ManagedAddress::from(PROVIDER.eval_to_array()),
            ManagedBuffer::from(b"0xpayloadhash"),
        )
        .egld(1_000_000_000_000_000u64)
        .run();

    world
        .tx()
        .from(PROVIDER)
        .to(ESCROW_ADDRESS)
        .typed(escrow_proxy::EscrowProxyMethods)
        .release_escrow(
            ManagedBuffer::from(b"task-001"),
            ManagedBuffer::from(b"0xproofhash"),
        )
        .run();

    world
        .check_account(PROVIDER)
        .balance(1_000_000_000_000_000u64);
}

#[test]
fn test_create_task_zero_payment_fails() {
    let mut world = world();
    world.account(BUYER).nonce(1).balance(1_000_000_000_000_000_000u64);

    world
        .tx()
        .from(OWNER)
        .typed(escrow_proxy::EscrowProxyMethods)
        .init(
            ManagedAddress::from(REGISTRY_ADDRESS.eval_to_array()),
            ManagedAddress::from(REPUTATION_ADDRESS.eval_to_array()),
        )
        .code("mxsc:output/escrow.mxsc.json")
        .new_address(ESCROW_ADDRESS)
        .run();

    world
        .tx()
        .from(BUYER)
        .to(ESCROW_ADDRESS)
        .typed(escrow_proxy::EscrowProxyMethods)
        .create_task(
            ManagedBuffer::from(b"task-zero"),
            ManagedBuffer::from(b"svc-001"),
            ManagedAddress::from(PROVIDER.eval_to_array()),
            ManagedBuffer::from(b"0xhash"),
        )
        .egld(0u64)
        .with_result(ExpectError(4, "Must attach EGLD payment"))
        .run();
}
