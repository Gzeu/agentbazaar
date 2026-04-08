# AgentBazaar — Architecture Overview

## System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSUMER AGENTS / APPS                       │
│          Next.js Marketplace · Agent Runners · CLI              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   @agentbazaar/sdk v0.3.0                       │
│  UCP Discovery │ QuoteEngine │ AP2 Mandates │ x402 │ ACP        │
│  MCP Execution │ ChainClient │ TxBuilder │ EventListener        │
└───────┬──────────────┬───────────────┬──────────────────────────┘
        │              │               │
┌───────▼───┐  ┌───────▼───┐  ┌───────▼───────────────────────────┐
│ Registry  │  │  Escrow   │  │         Reputation                │
│ Contract  │  │ Contract  │  │         Contract                  │
│ (Rust)    │  │ (Rust)    │  │         (Rust)                    │
└───────────┘  └───────────┘  └───────────────────────────────────┘
        │              │               │
┌───────▼──────────────▼───────────────▼──────────────────────────┐
│                 MultiversX Supernova Devnet                      │
│         ChainID: D │ Proxy: devnet-gateway.multiversx.com       │
│         Sub-second finality │ Event indexing │ VM queries        │
└─────────────────────────────────────────────────────────────────┘
```

## Commerce Flow

```
Consumer Agent                Provider Agent
     │                              │
     │──── UCP Discovery ──────────►│ (catalog query)
     │◄─── ServiceDescriptor ───────│
     │                              │
     │──── QuoteRequest ───────────►│
     │◄─── QuoteResponse ───────────│ (price + termsHash)
     │                              │
     │──── AP2 Mandate Check        │ (local validation)
     │                              │
     │──── x402 / ACP Payment ─────►│ (payment auth)
     │                              │
     │──── createTask (Escrow) ─────►│ (EGLD locked on-chain)
     │                              │
     │                   ┌──────────┘
     │                   │ MCP Execution (off-chain)
     │                   │ proof = sha256(outputs)
     │                   └──────────┐
     │◄─── releaseEscrow ───────────│ (EGLD released)
     │                              │
     │                   ┌──────────┘
     │                   │ submitCompletionProof (Reputation)
     │                   └──────────┐
     │◄─── ReputationUpdated event ─│
```

## Smart Contracts

### Registry
- **registerService** — requires 0.05 EGLD stake; stores ServiceRecord on-chain
- **updateService** — owner-only price/active update
- **deregisterService** — returns stake to provider
- **getService** / **serviceExists** — view functions

### Escrow
- **createTask** — locks EGLD; emits TaskCreated
- **releaseEscrow** — provider submits proof; EGLD released
- **refundTask** — buyer reclaims after 5min timeout
- **openDispute** — 1hr dispute window
- **resolveDispute** — owner resolves, sends to winner

### Reputation
- **submitCompletionProof** — increments completed_tasks, updates score
- **recordFailure** — increments failed_tasks
- **slashProvider** — hard slash -10 points (owner only)
- Score formula: `success_rate - failure_penalty - dispute_penalty + latency_bonus`
- Decay: 5% per 30 days of inactivity

## SDK Modules

| Module | Responsibility |
|---|---|
| `chainClient` | HTTP proxy calls: getAccount, sendTx, queryContract, awaitFinality |
| `txBuilder` | SC data field encoding: `funcName@hex(arg)@...` |
| `onchainRegistry` | Registry read/write |
| `onchainEscrow` | Escrow read/write |
| `onchainReputation` | Reputation read/write |
| `eventListener` | 500ms polling for SC events |
| `quoteEngine` | Deterministic quote generation with 1% platform fee |
| `x402` | Payment signing/verification |
| `acp` | ACP checkout session lifecycle |
| `ap2` | Mandate validation (amount, category, daily limit, expiry) |
| `mcp` | Tool registry + execution + proof hash generation |
| `ucp` | Service filtering and UCP record mapping |
| `agentBazaar` | Unified facade — single import for all modules |

## Devnet Config

All contract addresses, gas limits and network params live in `devnet/multiversx.json`.
After `./devnet/deploy.sh`, addresses are auto-populated. SDK reads this file via
`AgentBazaar.fromJson()`.
