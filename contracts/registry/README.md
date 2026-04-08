# Registry Contract

Smart contract Rust pe MultiversX care gestionează:
- Listarea serviciilor cu descriptor hash + metadata
- Staking minim per serviciu
- Activare / dezactivare servicii
- Query servicii per categorie sau provider

## Structura

```
contracts/registry/
├── src/
│   ├── lib.rs          # Entry points
│   ├── storage.rs      # Storage mappers
│   ├── views.rs        # Query endpoints
│   └── events.rs       # Event emitters
├── Cargo.toml
└── meta/
    └── src/main.rs
```

## Endpoints (planned)

| Endpoint | Type | Description |
|---|---|---|
| `registerService` | Call | Înregistrează un serviciu cu stake + descriptor |
| `updateService` | Call | Actualizează metadata serviciului |
| `deregisterService` | Call | Elimină serviciul și returnează stake |
| `getService` | View | Returnează descriptor hash + metadata |
| `getServicesByCategory` | View | Lista servicii per categorie |
| `getServicesByProvider` | View | Lista servicii per provider |
