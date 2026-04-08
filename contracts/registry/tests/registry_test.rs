use multiversx_sc_scenario::imports::*;

mod registry_proxy {
    multiversx_sc::imports!();
    multiversx_sc::derive_imports!();

    #[multiversx_sc::proxy]
    pub trait RegistryContractProxy {
        #[init]
        fn init(&self, marketplace_fee_bps: u64);

        #[payable("EGLD")]
        #[endpoint(registerService)]
        fn register_service(
            &self,
            service_id: ManagedBuffer,
            name: ManagedBuffer,
            category: ManagedBuffer,
            endpoint_url: ManagedBuffer,
            pricing_model: ManagedBuffer,
            price: BigUint,
            metadata_uri: ManagedBuffer,
        );

        #[endpoint(updateService)]
        fn update_service(
            &self,
            service_id: ManagedBuffer,
            new_price: BigUint,
            active: bool,
        );

        #[endpoint(deregisterService)]
        fn deregister_service(&self, service_id: ManagedBuffer);

        #[view(getService)]
        fn get_service(
            &self,
            service_id: ManagedBuffer,
        ) -> OptionalValue<registry::storage::ServiceRecord<StaticApi>>;

        #[view(serviceExists)]
        fn service_exists(&self, service_id: ManagedBuffer) -> bool;
    }
}

const REGISTRY_ADDRESS: TestSCAddress = TestSCAddress::new("registry");
const PROVIDER: TestAddress = TestAddress::new("provider");
const BUYER: TestAddress = TestAddress::new("buyer");

fn world() -> ScenarioWorld {
    let mut world = ScenarioWorld::new();
    world.register_contract(
        "mxsc:output/registry.mxsc.json",
        registry::ContractBuilder,
    );
    world
}

#[test]
fn test_register_service() {
    let mut world = world();
    world.account(PROVIDER).nonce(1).balance(100_000_000_000_000_000u64);

    world
        .tx()
        .from(PROVIDER)
        .typed(registry_proxy::RegistryContractProxyMethods)
        .init(100u64)
        .code("mxsc:output/registry.mxsc.json")
        .new_address(REGISTRY_ADDRESS)
        .run();

    world
        .tx()
        .from(PROVIDER)
        .to(REGISTRY_ADDRESS)
        .typed(registry_proxy::RegistryContractProxyMethods)
        .register_service(
            ManagedBuffer::from(b"svc-001"),
            ManagedBuffer::from(b"DataFetch Pro"),
            ManagedBuffer::from(b"data"),
            ManagedBuffer::from(b"https://example.com"),
            ManagedBuffer::from(b"fixed"),
            BigUint::from(1_000_000_000_000_000u64),
            ManagedBuffer::from(b"ipfs://meta"),
        )
        .egld(50_000_000_000_000_000u64)
        .run();

    let exists = world
        .query()
        .to(REGISTRY_ADDRESS)
        .typed(registry_proxy::RegistryContractProxyMethods)
        .service_exists(ManagedBuffer::from(b"svc-001"))
        .returns(ReturnsResult)
        .run();

    assert!(exists);
}

#[test]
fn test_register_without_stake_fails() {
    let mut world = world();
    world.account(PROVIDER).nonce(1).balance(100_000_000_000_000_000u64);

    world
        .tx()
        .from(PROVIDER)
        .typed(registry_proxy::RegistryContractProxyMethods)
        .init(100u64)
        .code("mxsc:output/registry.mxsc.json")
        .new_address(REGISTRY_ADDRESS)
        .run();

    world
        .tx()
        .from(PROVIDER)
        .to(REGISTRY_ADDRESS)
        .typed(registry_proxy::RegistryContractProxyMethods)
        .register_service(
            ManagedBuffer::from(b"svc-fail"),
            ManagedBuffer::from(b"Fail Service"),
            ManagedBuffer::from(b"data"),
            ManagedBuffer::from(b"https://fail.com"),
            ManagedBuffer::from(b"fixed"),
            BigUint::from(0u64),
            ManagedBuffer::from(b""),
        )
        .egld(0u64)
        .with_result(ExpectError(4, "Insufficient stake: minimum 0.05 EGLD required"))
        .run();
}
