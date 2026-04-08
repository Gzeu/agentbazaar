use multiversx_sc_scenario::imports::*;

const REGISTRY_WASM: &str = "output/registry.wasm";
const OWNER: TestAddress = TestAddress::new("owner");
const PROVIDER: TestAddress = TestAddress::new("provider");
const MIN_STAKE: u64 = 50_000_000_000_000_000; // 0.05 EGLD

fn world() -> ScenarioWorld {
    let mut world = ScenarioWorld::new();
    world.register_contract(REGISTRY_WASM, registry::ContractBuilder);
    world
}

#[test]
fn test_register_and_get_service() {
    let mut world = world();

    world
        .account(OWNER)
        .nonce(1)
        .balance(BigUint::from(1_000_000_000_000_000_000u64));

    world
        .account(PROVIDER)
        .nonce(1)
        .balance(BigUint::from(1_000_000_000_000_000_000u64));

    // Deploy
    let registry_addr = world
        .tx()
        .from(OWNER)
        .typed(registry::RegistryProxy)
        .init(BigUint::from(MIN_STAKE))
        .code(REGISTRY_WASM)
        .new_address(TestSCAddress::new("registry"))
        .returns(ReturnsNewAddress)
        .run();

    // Register service with stake
    world
        .tx()
        .from(PROVIDER)
        .to(registry_addr.clone())
        .egld(BigUint::from(MIN_STAKE))
        .typed(registry::RegistryProxy)
        .register_service(
            ManagedBuffer::from(b"svc-001"),
            ManagedBuffer::from(b"DataFetch Pro"),
            ManagedBuffer::from(b"data"),
            ManagedBuffer::from(b"https://example.com"),
            registry::PricingModel::Fixed,
            BigUint::from(1_000_000_000_000_000u64),
            ManagedBuffer::from(b"ipfs://meta"),
        )
        .run();

    // Query service
    world
        .query()
        .to(registry_addr.clone())
        .typed(registry::RegistryProxy)
        .get_service(ManagedBuffer::from(b"svc-001"))
        .returns(ReturnsResult)
        .run();
}

#[test]
fn test_register_insufficient_stake_fails() {
    let mut world = world();
    world
        .account(OWNER)
        .nonce(1)
        .balance(BigUint::from(1_000_000_000_000_000_000u64));
    world
        .account(PROVIDER)
        .nonce(1)
        .balance(BigUint::from(1_000_000_000_000_000_000u64));

    let registry_addr = world
        .tx()
        .from(OWNER)
        .typed(registry::RegistryProxy)
        .init(BigUint::from(MIN_STAKE))
        .code(REGISTRY_WASM)
        .new_address(TestSCAddress::new("registry"))
        .returns(ReturnsNewAddress)
        .run();

    world
        .tx()
        .from(PROVIDER)
        .to(registry_addr)
        .egld(BigUint::from(1u64)) // prea mic
        .typed(registry::RegistryProxy)
        .register_service(
            ManagedBuffer::from(b"svc-002"),
            ManagedBuffer::from(b"Test"),
            ManagedBuffer::from(b"data"),
            ManagedBuffer::from(b"https://example.com"),
            registry::PricingModel::Fixed,
            BigUint::zero(),
            ManagedBuffer::new(),
        )
        .with_result(ExpectError(4, "Insufficient stake"))
        .run();
}
