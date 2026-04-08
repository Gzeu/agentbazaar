use multiversx_sc_scenario::*;

fn world() -> ScenarioWorld {
    let mut blockchain = ScenarioWorld::new();
    blockchain.set_current_dir_from_workspace("contracts/escrow");
    blockchain.register_contract(
        "mxsc:output/escrow.mxsc.json",
        escrow::ContractBuilder,
    );
    blockchain
}

#[test]
fn test_create_and_release_task() {
    let mut world = world();
    let consumer = TestAddress::new("consumer");
    let provider = TestAddress::new("provider");
    let contract = TestSCAddress::new("escrow");
    let price = BigUint::from(1_000_000_000_000_000u64); // 0.001 EGLD

    world.account(consumer).balance(BigUint::from(10u64) * BigUint::from(1_000_000_000_000_000_000u64));
    world.account(provider).balance(BigUint::zero());
    world
        .tx()
        .from(consumer)
        .typed(escrow::EscrowContractProxy)
        .init()
        .code(MxscPath::new("output/escrow.mxsc.json"))
        .new_address(contract)
        .run();

    // Create task with payment
    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(price.clone())
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"svc-001"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"input-hash-abc"),
        )
        .run();

    // Provider releases task with proof
    world
        .tx()
        .from(provider)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .release_task(
            ManagedBuffer::from(b"task-0"),
            ManagedBuffer::from(b"result-hash-xyz"),
        )
        .run();

    // Provider should have received payment
    world
        .check_account(provider)
        .balance(price);
}

#[test]
fn test_refund_expired_task() {
    let mut world = world();
    let consumer = TestAddress::new("consumer");
    let provider = TestAddress::new("provider");
    let contract = TestSCAddress::new("escrow");
    let price = BigUint::from(1_000_000_000_000_000u64);

    world.account(consumer).balance(BigUint::from(10u64) * BigUint::from(1_000_000_000_000_000_000u64));
    world.account(provider).balance(BigUint::zero());
    world
        .tx()
        .from(consumer)
        .typed(escrow::EscrowContractProxy)
        .init()
        .code(MxscPath::new("output/escrow.mxsc.json"))
        .new_address(contract)
        .run();

    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(price.clone())
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"svc-001"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"input-hash-abc"),
        )
        .run();

    // Advance time past dispute window (3601 seconds)
    world.current_block().block_timestamp(3601u64);

    // Consumer requests refund
    world
        .tx()
        .from(consumer)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .refund_task(ManagedBuffer::from(b"task-0"))
        .run();

    // Consumer should have funds back (minus gas)
    world
        .check_account(consumer)
        .balance_at_least(price);
}
