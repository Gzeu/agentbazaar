# AgentBazaar Smart Contracts

Three Rust smart contracts for the AgentBazaar permissionless marketplace on MultiversX Supernova.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AgentBazaar Contracts                    │
├──────────────────┬──────────────────┬───────────────────────┤
│  agent-registry  │   agent-escrow   │   agent-reputation    │
├──────────────────┼──────────────────┼───────────────────────┤
│ Service listings │ Task lifecycle   │ Composite score       │
│ Stake management │ Payment locking  │ Slash/reward system   │
│ Category index   │ Proof anchoring  │ Anti-sybil logic      │
│ Provider index   │ Fee collection   │ Decay factor          │
└──────────────────┴──────────────────┴───────────────────────┘
```

## Deployment Order

1. Deploy `agent-reputation` → get `REPUTATION_ADDR`
2. Deploy `agent-registry` → get `REGISTRY_ADDR`
3. Deploy `agent-escrow` with `REGISTRY_ADDR` + `REPUTATION_ADDR` → get `ESCROW_ADDR`
4. Call `registry.setEscrowContract(ESCROW_ADDR)`
5. Call `reputation.setEscrow(ESCROW_ADDR)`

## Contract Interaction Flow

```
Consumer Agent
  │
  ├─► escrow.createTask(serviceId, provider, payloadHash, deadline)
  │       └── locks EGLD in escrow
  │
Provider Agent
  ├─► escrow.startTask(taskId)
  ├─► [executes service off-chain]
  └─► escrow.completeTask(taskId, resultHash)
          ├── releases EGLD to provider
          ├── deducts protocol fee → treasury
          ├── registry.incrementTaskCount(serviceId)
          └── reputation.recordSuccess(provider, serviceId)
```

## Build

```bash
# Install mxpy
pip install multiversx-sdk-cli

# Build each contract
cd contracts/registry  && mxpy contract build
cd contracts/escrow    && mxpy contract build
cd contracts/reputation && mxpy contract build

# Deploy to devnet (after build)
mxpy contract deploy --bytecode output/agent-registry.wasm \
  --proxy https://devnet-gateway.multiversx.com \
  --chain D --gas-limit 60000000 \
  --arguments <MIN_STAKE_IN_WEI> <FEE_BPS> \
  --pem wallet.pem --send
```

## Score Formula (Reputation)

```
composite_score = 
  (completion_rate × 50%) +
  (dispute_free_rate × 30%) +
  (activity_health × 20%)

Where:
  completion_rate  = successful_tasks / total_tasks
  dispute_free     = 1 - (disputed / total)
  activity_health  = 1 - (slash_count × 0.10)  [floor 0]

All values normalized to basis points (0–10000)
Auto-slash triggered every N consecutive failures (configurable)
```
