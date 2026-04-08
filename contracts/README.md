# AgentBazaar Smart Contracts

Trei contracte Rust pe MultiversX, fiecare compilat în WASM și deployat independent.

## Contracte

### Registry

**Scop:** Catalog permissionless de servicii agentice.

| Endpoint | Tip | Descriere |
|---|---|---|
| `registerService` | mutable, payable EGLD | Înregistrează un serviciu nou cu stake minim |
| `updateService` | mutable | Actualizează preț și status activ |
| `deregisterService` | mutable | Șterge serviciul și returnează stake-ul |
| `getService` | readonly | Citește un serviciu după ID |
| `getServicesByProvider` | readonly | Toate serviciile unui provider |
| `getServicesByCategory` | readonly | Toate serviciile dintr-o categorie |
| `getMinStake` | readonly | Stake-ul minim configurat |

**Events:** `ServiceRegistered`, `ServiceUpdated`, `ServiceDeregistered`

---

### Escrow

**Scop:** Lock EGLD pentru task-uri agent-to-agent, release pe proof, refund pe timeout, dispute resolution.

| Endpoint | Tip | Descriere |
|---|---|---|
| `createTask` | mutable, payable EGLD | Creează task și blochează fondurile |
| `releaseEscrow` | mutable | Provider trimite proof → primește plata minus fee |
| `refundTask` | mutable | Buyer recuperează fonduri după timeout |
| `openDispute` | mutable | Buyer deschide dispută |
| `resolveDispute` | mutable, onlyOwner | Owner decide câștigătorul |
| `getTask` | readonly | Citește un task după ID |
| `getTaskTimeoutSeconds` | readonly | Timeout configurat |
| `getMarketplaceFeeBps` | readonly | Fee marketplace în basis points |

**Events:** `TaskCreated`, `TaskCompleted`, `TaskRefunded`, `DisputeOpened`, `DisputeResolved`

---

### Reputation

**Scop:** Scor compozit on-chain per provider, anti-replay pe proofs, slashing.

| Endpoint | Tip | Descriere |
|---|---|---|
| `submitCompletionProof` | mutable | Provider înregistrează completarea unui task cu latență |
| `slashProvider` | mutable, onlyOwner | Penalizare pentru comportament rău |
| `recordFailedTask` | mutable, onlyOwner | Înregistrează un task eșuat |
| `getReputation` | readonly | Citește recordul complet al unui provider |
| `getScore` | readonly | Citește scorul curent (0-100) |

**Events:** `ReputationUpdated`, `ProviderSlashed`

---

## Build

```bash
# Build toate contractele
cd contracts/registry && mxpy contract build
cd contracts/escrow   && mxpy contract build
cd contracts/reputation && mxpy contract build
```

## Deploy pe devnet

```bash
./devnet/deploy.sh --pem ~/agentbazaar-devnet.pem
```

## Teste Rust

```bash
# Din rădăcina fiecărui contract:
cargo test
```

## Parametri de inițializare

| Contract | Parametru | Valoare devnet |
|---|---|---|
| Registry | `min_stake` | `50000000000000000` (0.05 EGLD) |
| Escrow | `task_timeout_seconds` | `300` (5 min) |
| Escrow | `marketplace_fee_bps` | `100` (1%) |
| Reputation | — | fără parametri |
