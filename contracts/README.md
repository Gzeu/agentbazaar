# AgentBazaar Smart Contracts

Deployed on **MultiversX Supernova Devnet** | Framework: `multiversx-sc v0.54`

## Contract Architecture

```
┌─────────────────────┐    incrementTaskCount     ┌──────────────────────┐
│   Registry Contract  │ ◄─────────────────────── │   Escrow Contract    │
│                     │                           │                      │
│ • Service listings  │    slashProvider           │ • Task lifecycle     │
│ • Provider stake    │ ◄─────────────────────── │ • Escrow lock/release│
│ • UCP descriptors   │                           │ • Dispute handling   │
└─────────────────────┘                           └──────────────────────┘
                                                           │
                                                recordTaskOutcome
                                                recordDispute
                                                           ▼
                                              ┌──────────────────────────┐
                                              │   Reputation Contract    │
                                              │                          │
                                              │ • Composite score formula│
                                              │ • Temporal decay         │
                                              │ • Dispute penalties      │
                                              │ • Anti-sybil via stake   │
                                              └──────────────────────────┘
```

## Contracts

### 1. Registry (`contracts/registry/`)
- `registerService(...)` — payable, stakes EGLD, registers service descriptor
- `deactivateService(id)` — provider or owner deactivation
- `incrementTaskCount(id)` — called by Escrow on task completion
- `slashProvider(addr, amount)` — owner-only, confiscates stake
- Views: `getService`, `getProviderStake`, `getServiceCount`

### 2. Escrow (`contracts/escrow/`)
- `submitTask(...)` — consumer locks budget, creates task record
- `submitProofAndRelease(task_id, proof_hash)` — provider releases, notifies Registry
- `refundExpired(task_id)` — anyone triggers refund after deadline
- `openDispute(task_id, reason_hash)` — consumer opens within dispute window
- `resolveDispute(task_id, favor_consumer)` — owner/DAO resolves
- Views: `getTask`, `getTaskCount`

### 3. Reputation (`contracts/reputation/`)
- `recordTaskOutcome(provider, success, latency_ms, stake_units)` — updates score
- `recordDispute(provider)` — applies dispute penalty (-500 bps)
- **Composite Score Formula:**
  - `completion_component = (successful/total) × completion_weight`
  - `latency_component = latency_score × latency_weight` (target: <500ms)
  - `stake_component = min(stake, 10 EGLD) × stake_weight`
  - Score: 0-10000 bps (100.00%)
- **Temporal decay**: `score × (10000 - decay_bps) / 10000` per epoch
- Views: `getScore`, `getRecord`

## Build

```bash
# Install mxpy
pip install multiversx-sdk-cli

# Build all contracts
cd contracts/registry && mxpy contract build
cd contracts/escrow && mxpy contract build  
cd contracts/reputation && mxpy contract build
```

## Deploy to Devnet

```bash
# 1. Deploy Reputation first (no deps)
mxpy contract deploy --bytecode=contracts/reputation/output/reputation.wasm \
  --pem=wallet.pem --chain=D --gas-limit=50000000 \
  --arguments $ESCROW_ADDR 6000 2500 1500 50

# 2. Deploy Registry
mxpy contract deploy --bytecode=contracts/registry/output/registry.wasm \
  --pem=wallet.pem --chain=D --gas-limit=50000000 \
  --arguments 100000000000000000 50  # 0.1 EGLD min stake, 0.5% fee

# 3. Deploy Escrow (needs Registry + Reputation addresses)
mxpy contract deploy --bytecode=contracts/escrow/output/escrow.wasm \
  --pem=wallet.pem --chain=D --gas-limit=50000000 \
  --arguments $REGISTRY_ADDR $REPUTATION_ADDR 3600  # 1h dispute window
```

## Security Notes

- All cross-contract calls use `sync_call()` — verify gas limits on Devnet
- Dispute resolution is currently owner-only — upgrade to DAO voting for Mainnet
- Stake slashing requires `owner` — plan transition to multisig governance
- Proof hashes are off-chain computed — add ZK proof verification for Mainnet
