use multiversx_sc_scenario::*;

fn world() -> ScenarioWorld {
    let mut blockchain = ScenarioWorld::new();
    blockchain.set_current_dir_from_workspace("contracts/registry");
    blockchain.register_contract(
        "mxsc:output/registry.mxsc.json",
        registry::ContractBuilder,
    );
    blockchain
}

#[test]
fn test_register_and_get_service() {
    let mut world = world();
    let owner = TestAddress::new("owner");
    let contract = TestSCAddress::new("registry");

    world.account(owner).balance(BigUint::from(10u64) * BigUint::from(1_000_000_000_000_000_000u64));
    world
        .tx()
        .from(owner)
        .typed(registry::RegistryContractProxy)
        .init()
        .code(MxscPath::new("output/registry.mxsc.json"))
        .new_address(contract)
        .run();

    // Register a service
    world
        .tx()
        .from(owner)
        .to(contract)
        .typed(registry::RegistryContractProxy)
        .register_service(
            ManagedBuffer::from(b"svc-001"),
            ManagedBuffer::from(b"Data Fetcher"),
            ManagedBuffer::from(b"data-fetching"),
            BigUint::from(1_000_000_000_000_000u64), // 0.001 EGLD
            ManagedBuffer::from(b"https://provider.example.com/mcp"),
            ManagedBuffer::from(b"QmHash123abc"),
        )
        .run();

    // Service count should be 1
    let count: u64 = world
        .query()
        .to(contract)
        .typed(registry::RegistryContractProxy)
        .get_service_count()
        .returns(ReturnsResult)
        .run();
    assert_eq!(count, 1);
}

#[test]
fn test_deregister_service() {
    let mut world = world();
    let owner = TestAddress::new("owner");
    let contract = TestSCAddress::new("registry");

    world.account(owner).balance(BigUint::from(10u64) * BigUint::from(1_000_000_000_000_000_000u64));
    world
        .tx()
        .from(owner)
        .typed(registry::RegistryContractProxy)
        .init()
        .code(MxscPath::new("output/registry.mxsc.json"))
        .new_address(contract)
        .run();

    world
        .tx()
        .from(owner)
        .to(contract)
        .typed(registry::RegistryContractProxy)
        .register_service(
            ManagedBuffer::from(b"svc-001"),
            ManagedBuffer::from(b"Data Fetcher"),
            ManagedBuffer::from(b"data-fetching"),
            BigUint::from(1_000_000_000_000_000u64),
            ManagedBuffer::from(b"https://provider.example.com/mcp"),
            ManagedBuffer::from(b"QmHash123abc"),
        )
        .run();

    world
        .tx()
        .from(owner)
        .to(contract)
        .typed(registry::RegistryContractProxy)
        .deregister_service(ManagedBuffer::from(b"svc-001"))
        .run();

    let count: u64 = world
        .query()
        .to(contract)
        .typed(registry::RegistryContractProxy)
        .get_service_count()
        .returns(ReturnsResult)
        .run();
    assert_eq!(count, 0);
}
