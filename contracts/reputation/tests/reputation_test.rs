use multiversx_sc_scenario::imports::*;

const REPUTATION_WASM: &str = "output/reputation.wasm";
const OWNER: TestAddress = TestAddress::new("owner");
const PROVIDER: TestAddress = TestAddress::new("provider");

fn world() -> ScenarioWorld {
    let mut world = ScenarioWorld::new();
    world.register_contract(REPUTATION_WASM, reputation::ContractBuilder);
    world
}

#[test]
fn test_submit_proof_and_get_score() {
    let mut world = world();
    world
        .account(OWNER)
        .nonce(1)
        .balance(BigUint::from(1_000_000_000_000_000_000u64));
    world
        .account(PROVIDER)
        .nonce(1)
        .balance(BigUint::from(1_000_000_000_000_000_000u64));

    let rep_addr = world
        .tx()
        .from(OWNER)
        .typed(reputation::ReputationProxy)
        .init()
        .code(REPUTATION_WASM)
        .new_address(TestSCAddress::new("reputation"))
        .returns(ReturnsNewAddress)
        .run();

    world
        .tx()
        .from(PROVIDER)
        .to(rep_addr.clone())
        .typed(reputation::ReputationProxy)
        .submit_completion_proof(
            ManagedBuffer::from(b"task-001"),
            ManagedBuffer::from(b"0xproofhash"),
            220u64,
        )
        .run();

    let score = world
        .query()
        .to(rep_addr)
        .typed(reputation::ReputationProxy)
        .get_score(PROVIDER.to_managed_address())
        .returns(ReturnsResult)
        .run();

    assert!(score > 0, "Score should be positive after completion");
}

#[test]
fn test_slash_reduces_score() {
    let mut world = world();
    world
        .account(OWNER)
        .nonce(1)
        .balance(BigUint::from(1_000_000_000_000_000_000u64));
    world
        .account(PROVIDER)
        .nonce(1)
        .balance(BigUint::from(1_000_000_000_000_000_000u64));

    let rep_addr = world
        .tx()
        .from(OWNER)
        .typed(reputation::ReputationProxy)
        .init()
        .code(REPUTATION_WASM)
        .new_address(TestSCAddress::new("reputation"))
        .returns(ReturnsNewAddress)
        .run();

    world
        .tx()
        .from(OWNER)
        .to(rep_addr.clone())
        .typed(reputation::ReputationProxy)
        .slash_provider(
            PROVIDER.to_managed_address(),
            ManagedBuffer::from(b"task-002"),
            ManagedBuffer::from(b"Non-delivery"),
        )
        .run();

    let score = world
        .query()
        .to(rep_addr)
        .typed(reputation::ReputationProxy)
        .get_score(PROVIDER.to_managed_address())
        .returns(ReturnsResult)
        .run();

    assert!(score < 100, "Slash should reduce score below 100");
}
