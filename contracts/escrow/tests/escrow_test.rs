use multiversx_sc_scenario::imports::*;

const ESCROW_WASM: &str = "output/escrow.wasm";
const OWNER: TestAddress = TestAddress::new("owner");
const BUYER: TestAddress = TestAddress::new("buyer");
const PROVIDER: TestAddress = TestAddress::new("provider");
const TASK_TIMEOUT: u64 = 300;
const FEE_BPS: u64 = 100;
const TASK_AMOUNT: u64 = 1_000_000_000_000_000;

fn world() -> ScenarioWorld {
    let mut world = ScenarioWorld::new();
    world.register_contract(ESCROW_WASM, escrow::ContractBuilder);
    world
}

#[test]
fn test_create_and_release_task() {
    let mut world = world();
    for addr in [OWNER, BUYER, PROVIDER] {
        world
            .account(addr)
            .nonce(1)
            .balance(BigUint::from(1_000_000_000_000_000_000u64));
    }

    let escrow_addr = world
        .tx()
        .from(OWNER)
        .typed(escrow::EscrowProxy)
        .init(TASK_TIMEOUT, FEE_BPS)
        .code(ESCROW_WASM)
        .new_address(TestSCAddress::new("escrow"))
        .returns(ReturnsNewAddress)
        .run();

    world
        .tx()
        .from(BUYER)
        .to(escrow_addr.clone())
        .egld(BigUint::from(TASK_AMOUNT))
        .typed(escrow::EscrowProxy)
        .create_task(
            ManagedBuffer::from(b"task-001"),
            ManagedBuffer::from(b"svc-001"),
            PROVIDER.to_managed_address(),
            ManagedBuffer::from(b"0xpayloadhash"),
        )
        .run();

    world
        .tx()
        .from(PROVIDER)
        .to(escrow_addr.clone())
        .typed(escrow::EscrowProxy)
        .release_escrow(
            ManagedBuffer::from(b"task-001"),
            ManagedBuffer::from(b"0xproofhash"),
        )
        .run();

    // Provider should have received payout minus fee
    let expected_payout = TASK_AMOUNT - (TASK_AMOUNT * FEE_BPS / 10_000);
    world
        .check_account(PROVIDER)
        .balance(BigUint::from(1_000_000_000_000_000_000u64 + expected_payout));
}

#[test]
fn test_open_dispute() {
    let mut world = world();
    for addr in [OWNER, BUYER, PROVIDER] {
        world
            .account(addr)
            .nonce(1)
            .balance(BigUint::from(1_000_000_000_000_000_000u64));
    }

    let escrow_addr = world
        .tx()
        .from(OWNER)
        .typed(escrow::EscrowProxy)
        .init(TASK_TIMEOUT, FEE_BPS)
        .code(ESCROW_WASM)
        .new_address(TestSCAddress::new("escrow"))
        .returns(ReturnsNewAddress)
        .run();

    world
        .tx()
        .from(BUYER)
        .to(escrow_addr.clone())
        .egld(BigUint::from(TASK_AMOUNT))
        .typed(escrow::EscrowProxy)
        .create_task(
            ManagedBuffer::from(b"task-002"),
            ManagedBuffer::from(b"svc-001"),
            PROVIDER.to_managed_address(),
            ManagedBuffer::from(b"0xpayload"),
        )
        .run();

    world
        .tx()
        .from(BUYER)
        .to(escrow_addr)
        .typed(escrow::EscrowProxy)
        .open_dispute(
            ManagedBuffer::from(b"task-002"),
            ManagedBuffer::from(b"Service not delivered"),
        )
        .run();
}
