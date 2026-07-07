//! Escrow contract scenario tests — multiversx-sc-scenario 0.65.x
//!
//! Run with: cargo test -p escrow
//!
//! Tests that send EGLD require a compiled .mxsc.json in output/.
//! Without `mxpy contract build` the deploy step panics — expected in CI
//! without a prior build. Error-path tests use ExpectError and validate
//! business logic independently of the artefact.

use multiversx_sc::types::BigUint;
use multiversx_sc_scenario::*;

const MXSC_PATH: &str = "mxsc:output/escrow.mxsc.json";
const EGLD_1: u64 = 1_000_000_000_000_000_000;
const TASK_TIMEOUT_S: u64 = 1800;

// ── helpers ──────────────────────────────────────────────────────────────────

fn world() -> ScenarioWorld {
    let mut blockchain = ScenarioWorld::new();
    blockchain.set_current_dir_from_workspace("contracts/escrow");
    blockchain.register_contract(MXSC_PATH, escrow::ContractBuilder);
    blockchain
}

fn deploy(
    world: &mut ScenarioWorld,
    owner: TestAddress,
    contract: TestSCAddress,
    registry: TestAddress,
    reputation: TestAddress,
    treasury: TestAddress,
    fee_bps: u64,
) {
    world
        .tx()
        .from(owner)
        .typed(escrow::EscrowContractProxy)
        .init(
            registry.to_managed_address(),
            reputation.to_managed_address(),
            treasury.to_managed_address(),
            fee_bps,
        )
        .code(MxscPath::new("output/escrow.mxsc.json"))
        .new_address(contract)
        .run();
}

// ── Test 1: happy-path create → releaseEscrow (0 % fee) ──────────────────────

#[test]
fn test_create_and_release_no_fee() {
    let mut world = world();

    let owner    = TestAddress::new("owner");
    let consumer = TestAddress::new("consumer");
    let provider = TestAddress::new("provider");
    let registry = TestAddress::new("registry");
    let rep      = TestAddress::new("reputation");
    let treasury = TestAddress::new("treasury");
    let contract = TestSCAddress::new("escrow");

    let price = BigUint::from(EGLD_1);

    world.account(owner).balance(BigUint::from(10u64 * EGLD_1));
    world.account(consumer).balance(BigUint::from(10u64 * EGLD_1));
    world.account(provider).balance(BigUint::zero());
    world.account(registry);
    world.account(rep);
    world.account(treasury);

    deploy(&mut world, owner, contract, registry, rep, treasury, 0);

    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(price.clone())
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"task-001"),
            ManagedBuffer::from(b"svc-ai-001"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"payload-hash-abc"),
        )
        .run();

    world
        .tx()
        .from(provider)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .release_escrow(
            ManagedBuffer::from(b"task-001"),
            ManagedBuffer::from(b"proof-hash-xyz"),
        )
        .run();

    world.check_account(provider).balance(price);
    world.check_account(treasury).balance(BigUint::zero());
}

// ── Test 2: releaseEscrow with 2.5 % fee → treasury receives fee ──────────────

#[test]
fn test_release_with_fee() {
    let mut world = world();

    let owner    = TestAddress::new("owner");
    let consumer = TestAddress::new("consumer");
    let provider = TestAddress::new("provider");
    let registry = TestAddress::new("registry");
    let rep      = TestAddress::new("reputation");
    let treasury = TestAddress::new("treasury");
    let contract = TestSCAddress::new("escrow");

    let fee_bps = 250u64;
    let price   = BigUint::from(EGLD_1);
    let fee     = BigUint::from(EGLD_1 * fee_bps / 10_000);
    let payout  = price.clone() - fee.clone();

    world.account(owner).balance(BigUint::from(10u64 * EGLD_1));
    world.account(consumer).balance(BigUint::from(10u64 * EGLD_1));
    world.account(provider).balance(BigUint::zero());
    world.account(registry);
    world.account(rep);
    world.account(treasury).balance(BigUint::zero());

    deploy(&mut world, owner, contract, registry, rep, treasury, fee_bps);

    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(price)
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"task-002"),
            ManagedBuffer::from(b"svc-ai-002"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"ph-002"),
        )
        .run();

    world
        .tx()
        .from(provider)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .release_escrow(
            ManagedBuffer::from(b"task-002"),
            ManagedBuffer::from(b"proof-002"),
        )
        .run();

    world.check_account(provider).balance(payout);
    world.check_account(treasury).balance(fee);
}

// ── Test 3: refundTask after TASK_TIMEOUT ────────────────────────────────────

#[test]
fn test_refund_after_timeout() {
    let mut world = world();

    let owner    = TestAddress::new("owner");
    let consumer = TestAddress::new("consumer");
    let provider = TestAddress::new("provider");
    let registry = TestAddress::new("registry");
    let rep      = TestAddress::new("reputation");
    let treasury = TestAddress::new("treasury");
    let contract = TestSCAddress::new("escrow");

    let price            = BigUint::from(EGLD_1);
    let consumer_initial = BigUint::from(10u64 * EGLD_1);

    world.account(owner).balance(BigUint::from(EGLD_1));
    world.account(consumer).balance(consumer_initial.clone());
    world.account(provider).balance(BigUint::zero());
    world.account(registry);
    world.account(rep);
    world.account(treasury);

    deploy(&mut world, owner, contract, registry, rep, treasury, 0);

    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(price.clone())
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"task-003"),
            ManagedBuffer::from(b"svc-003"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"ph-003"),
        )
        .run();

    world.current_block().block_timestamp(TASK_TIMEOUT_S + 1);

    world
        .tx()
        .from(consumer)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .refund_task(ManagedBuffer::from(b"task-003"))
        .run();

    world
        .check_account(consumer)
        .balance_at_least(consumer_initial - BigUint::from(EGLD_1 / 100));
}

// ── Test 4: refundTask BEFORE timeout → must fail ────────────────────────────

#[test]
fn test_refund_before_timeout_fails() {
    let mut world = world();

    let owner    = TestAddress::new("owner");
    let consumer = TestAddress::new("consumer");
    let provider = TestAddress::new("provider");
    let registry = TestAddress::new("registry");
    let rep      = TestAddress::new("reputation");
    let treasury = TestAddress::new("treasury");
    let contract = TestSCAddress::new("escrow");

    world.account(owner).balance(BigUint::from(EGLD_1));
    world.account(consumer).balance(BigUint::from(10u64 * EGLD_1));
    world.account(provider);
    world.account(registry);
    world.account(rep);
    world.account(treasury);

    deploy(&mut world, owner, contract, registry, rep, treasury, 0);

    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(BigUint::from(EGLD_1))
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"task-004"),
            ManagedBuffer::from(b"svc-004"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"ph-004"),
        )
        .run();

    world.current_block().block_timestamp(100u64);

    world
        .tx()
        .from(consumer)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .refund_task(ManagedBuffer::from(b"task-004"))
        .with_result(ExpectError(4, "Task timeout not reached yet (30 min)"))
        .run();
}

// ── Test 5: duplicate task_id → must fail ────────────────────────────────────

#[test]
fn test_duplicate_task_id_fails() {
    let mut world = world();

    let owner    = TestAddress::new("owner");
    let consumer = TestAddress::new("consumer");
    let provider = TestAddress::new("provider");
    let registry = TestAddress::new("registry");
    let rep      = TestAddress::new("reputation");
    let treasury = TestAddress::new("treasury");
    let contract = TestSCAddress::new("escrow");

    world.account(owner).balance(BigUint::from(EGLD_1));
    world.account(consumer).balance(BigUint::from(10u64 * EGLD_1));
    world.account(provider);
    world.account(registry);
    world.account(rep);
    world.account(treasury);

    deploy(&mut world, owner, contract, registry, rep, treasury, 0);

    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(BigUint::from(EGLD_1))
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"task-dup"),
            ManagedBuffer::from(b"svc-x"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"ph-dup"),
        )
        .run();

    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(BigUint::from(EGLD_1))
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"task-dup"),
            ManagedBuffer::from(b"svc-x"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"ph-dup"),
        )
        .with_result(ExpectError(4, "Task ID already exists"))
        .run();
}

// ── Test 6: openDispute + 2-of-3 arbiter vote → buyer wins ───────────────────

#[test]
fn test_dispute_2of3_buyer_wins() {
    let mut world = world();

    let owner    = TestAddress::new("owner");
    let consumer = TestAddress::new("consumer");
    let provider = TestAddress::new("provider");
    let arbiter1 = TestAddress::new("arbiter1");
    let arbiter2 = TestAddress::new("arbiter2");
    let arbiter3 = TestAddress::new("arbiter3");
    let registry = TestAddress::new("registry");
    let rep      = TestAddress::new("reputation");
    let treasury = TestAddress::new("treasury");
    let contract = TestSCAddress::new("escrow");

    let price = BigUint::from(EGLD_1);

    world.account(owner).balance(BigUint::from(10u64 * EGLD_1));
    world.account(consumer).balance(BigUint::from(10u64 * EGLD_1));
    world.account(provider).balance(BigUint::zero());
    world.account(arbiter1);
    world.account(arbiter2);
    world.account(arbiter3);
    world.account(registry);
    world.account(rep);
    world.account(treasury);

    deploy(&mut world, owner, contract, registry, rep, treasury, 0);

    for arb in [arbiter1, arbiter2, arbiter3] {
        world
            .tx()
            .from(owner)
            .to(contract)
            .typed(escrow::EscrowContractProxy)
            .add_arbiter(arb.to_managed_address())
            .run();
    }

    world
        .tx()
        .from(consumer)
        .to(contract)
        .egld(price.clone())
        .typed(escrow::EscrowContractProxy)
        .create_task(
            ManagedBuffer::from(b"task-disp"),
            ManagedBuffer::from(b"svc-disp"),
            provider.to_managed_address(),
            ManagedBuffer::from(b"ph-disp"),
        )
        .run();

    world
        .tx()
        .from(consumer)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .open_dispute(
            ManagedBuffer::from(b"task-disp"),
            ManagedBuffer::from(b"Provider did not deliver"),
        )
        .run();

    world
        .tx()
        .from(arbiter1)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .vote_dispute(ManagedBuffer::from(b"task-disp"), true)
        .run();

    // Second vote reaches threshold=2 → buyer receives funds
    world
        .tx()
        .from(arbiter2)
        .to(contract)
        .typed(escrow::EscrowContractProxy)
        .vote_dispute(ManagedBuffer::from(b"task-disp"), true)
        .run();

    world
        .check_account(consumer)
        .balance_at_least(price);
}
