use multiversx_sc_scenario::imports::*;

const REPUTATION_ADDRESS: TestSCAddress = TestSCAddress::new("reputation");
const ESCROW_ADDRESS: TestSCAddress = TestSCAddress::new("escrow");
const PROVIDER: TestAddress = TestAddress::new("provider");
const OWNER: TestAddress = TestAddress::new("owner");

mod reputation_proxy {
    multiversx_sc::imports!();
    #[multiversx_sc::proxy]
    pub trait ReputationProxy {
        #[init]
        fn init(&self, escrow_address: ManagedAddress);

        #[endpoint(submitCompletionProof)]
        fn submit_completion_proof(
            &self,
            task_id: ManagedBuffer,
            proof_hash: ManagedBuffer,
            latency_ms: u64,
        );

        #[endpoint(slashProvider)]
        fn slash_provider(
            &self,
            provider: ManagedAddress,
            task_id: ManagedBuffer,
            reason: ManagedBuffer,
        );

        #[view(getScore)]
        fn get_score(&self, provider: ManagedAddress) -> u64;

        #[view(getReputation)]
        fn get_reputation(&self, provider: ManagedAddress) -> reputation::storage::ReputationRecord<StaticApi>;
    }
}

fn world() -> ScenarioWorld {
    let mut world = ScenarioWorld::new();
    world.register_contract("mxsc:output/reputation.mxsc.json", reputation::ContractBuilder);
    world
}

#[test]
fn test_initial_score_is_50() {
    let mut world = world();
    world.account(OWNER).nonce(1);
    world.account(PROVIDER).nonce(1);

    world
        .tx()
        .from(OWNER)
        .typed(reputation_proxy::ReputationProxyMethods)
        .init(ManagedAddress::from(ESCROW_ADDRESS.eval_to_array()))
        .code("mxsc:output/reputation.mxsc.json")
        .new_address(REPUTATION_ADDRESS)
        .run();

    let score = world
        .query()
        .to(REPUTATION_ADDRESS)
        .typed(reputation_proxy::ReputationProxyMethods)
        .get_score(ManagedAddress::from(PROVIDER.eval_to_array()))
        .returns(ReturnsResult)
        .run();

    assert_eq!(score, 50);
}

#[test]
fn test_submit_proof_increases_completed() {
    let mut world = world();
    world.account(OWNER).nonce(1);

    world
        .tx()
        .from(OWNER)
        .typed(reputation_proxy::ReputationProxyMethods)
        .init(ManagedAddress::from(ESCROW_ADDRESS.eval_to_array()))
        .code("mxsc:output/reputation.mxsc.json")
        .new_address(REPUTATION_ADDRESS)
        .run();

    world
        .tx()
        .from(OWNER)
        .to(REPUTATION_ADDRESS)
        .typed(reputation_proxy::ReputationProxyMethods)
        .submit_completion_proof(
            ManagedBuffer::from(b"task-001"),
            ManagedBuffer::from(b"0xproofhash"),
            200u64,
        )
        .run();

    let rep = world
        .query()
        .to(REPUTATION_ADDRESS)
        .typed(reputation_proxy::ReputationProxyMethods)
        .get_reputation(ManagedAddress::from(OWNER.eval_to_array()))
        .returns(ReturnsResult)
        .run();

    assert_eq!(rep.completed_tasks, 1);
}
