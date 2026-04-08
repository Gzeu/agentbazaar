use multiversx_sc_scenario::*;

fn world() -> ScenarioWorld {
    let mut blockchain = ScenarioWorld::new();
    blockchain.set_current_dir_from_workspace("contracts/reputation");
    blockchain.register_contract(
        "mxsc:output/reputation.mxsc.json",
        reputation::ContractBuilder,
    );
    blockchain
}

#[test]
fn test_init() {
    let mut world = world();
    let owner = TestAddress::new("owner");
    let contract = TestSCAddress::new("reputation");
    let min_stake = BigUint::from(100_000_000_000_000_000u64); // 0.1 EGLD

    world.account(owner).balance(BigUint::from(10u64) * BigUint::from(1_000_000_000_000_000_000u64));
    world
        .tx()
        .from(owner)
        .typed(reputation::ReputationContractProxy)
        .init(min_stake.clone())
        .code(MxscPath::new("output/reputation.mxsc.json"))
        .new_address(contract)
        .run();

    // Default score for unknown agent should be 50
    let score: u64 = world
        .query()
        .to(contract)
        .typed(reputation::ReputationContractProxy)
        .get_score(owner)
        .returns(ReturnsResult)
        .run();
    assert_eq!(score, 50);
}

#[test]
fn test_record_success_increases_score() {
    let mut world = world();
    let owner = TestAddress::new("owner");
    let agent = TestAddress::new("agent");
    let contract = TestSCAddress::new("reputation");
    let min_stake = BigUint::from(100_000_000_000_000_000u64);

    world.account(owner).balance(BigUint::from(10u64) * BigUint::from(1_000_000_000_000_000_000u64));
    world.account(agent).balance(BigUint::zero());
    world
        .tx()
        .from(owner)
        .typed(reputation::ReputationContractProxy)
        .init(min_stake)
        .code(MxscPath::new("output/reputation.mxsc.json"))
        .new_address(contract)
        .run();

    // Record 10 successful tasks at 300ms latency
    for _ in 0..10 {
        world
            .tx()
            .from(owner)
            .to(contract)
            .typed(reputation::ReputationContractProxy)
            .record_success(agent.to_managed_address(), 300u64)
            .run();
    }

    let score: u64 = world
        .query()
        .to(contract)
        .typed(reputation::ReputationContractProxy)
        .get_score(agent.to_managed_address())
        .returns(ReturnsResult)
        .run();
    // 10/10 completion = 70 base + 10 latency bonus = 80
    assert!(score >= 75, "Score should be high after 10 successes, got {}", score);
}

#[test]
fn test_dispute_decreases_score() {
    let mut world = world();
    let owner = TestAddress::new("owner");
    let agent = TestAddress::new("agent");
    let contract = TestSCAddress::new("reputation");

    world.account(owner).balance(BigUint::from(10u64) * BigUint::from(1_000_000_000_000_000_000u64));
    world.account(agent).balance(BigUint::zero());
    world
        .tx()
        .from(owner)
        .typed(reputation::ReputationContractProxy)
        .init(BigUint::from(100_000_000_000_000_000u64))
        .code(MxscPath::new("output/reputation.mxsc.json"))
        .new_address(contract)
        .run();

    world
        .tx()
        .from(owner)
        .to(contract)
        .typed(reputation::ReputationContractProxy)
        .record_dispute(agent.to_managed_address())
        .run();

    let score: u64 = world
        .query()
        .to(contract)
        .typed(reputation::ReputationContractProxy)
        .get_score(agent.to_managed_address())
        .returns(ReturnsResult)
        .run();
    // Default 50 - 20 hard penalty = 30
    assert_eq!(score, 30, "Dispute should reduce score by 20, got {}", score);
}
