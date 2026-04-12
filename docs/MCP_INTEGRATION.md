# AgentBazaar × MultiversX SC MCP — Integration Guide

## Overview

This document describes the SC MCP integration introduced in `feat/mcp-integration`.

## Architecture

```
AI Agent (Claude / Cursor / OpenClaw)
    ↕ MCP protocol
┌─────────────────────────────────────┐
│   MultiversX SC MCP Server           │
│   (multiversx-sc-mcp npm package)    │
│   Tools: abi, query, call, decode,   │
│   storage, token, simulate, search   │
└──────────────┬──────────────────────┘
               │ on-chain
┌──────────────▼──────────────────────┐
│   MultiversX Devnet/Mainnet          │
│   Registry │ Escrow │ Reputation     │
└──────────────┬──────────────────────┘
               │ events + queries
┌──────────────▼──────────────────────┐
│   AgentBazaar Backend (NestJS)       │
│   McpClientService   (MCP bridge)    │
│   McpContractService (contract ops)  │
│   TasksService       (real execution)│
│   DiscoveryService   (UCP catalog)   │
│   EventPoller        (chain sync)    │
└─────────────────────────────────────┘
```

## New Files

| File | Purpose |
|---|---|
| `src/multiversx/mcp-client.service.ts` | MCP client — connects to SC MCP server, exposes typed tool calls |
| `src/multiversx/mcp-contract.service.ts` | High-level contract operations (registry, escrow, reputation) |

## Modified Files

| File | Change |
|---|---|
| `src/tasks/tasks.service.ts` | Replaced `simulateExecution()` with `executeTaskReal()` — real on-chain flow |
| `src/discovery/discovery.service.ts` | Added `getUcpCatalog()` — UCP-standard catalog for AI agent discovery |
| `src/discovery/discovery.controller.ts` | Added `GET /discovery/ucp` and `GET /discovery/well-known` endpoints |
| `src/events/event.poller.ts` | Added `handleTaskCompleted()` — decodes on-chain events via SC MCP |
| `src/reputation/reputation.service.ts` | On-chain score sync via `McpContractService.getReputation()` |
| `src/services/services.service.ts` | `syncFromChain()` on init — merges on-chain registry with in-memory seed |

## Environment Variables

```env
# Path to backend PEM wallet (for signing write transactions)
MVX_WALLET_PEM_PATH=./wallet/backend.pem

# Or inline PEM content (overrides path)
MVX_WALLET_PEM_CONTENT=

# Public API URL (used in UCP catalog)
API_BASE_URL=https://your-backend.vercel.app

# Set to 'true' in production to require on-chain escrow before task execution
X402_REQUIRE_ESCROW=false
```

## Installation

```bash
cd apps/backend
npm install
# Install SC MCP (once published to npm):
npm install multiversx-sc-mcp
# Or from GitHub directly:
npm install github:psorinionut/multiversx-sc-mcp
```

## UCP Endpoint

AI agents discover services at:

```
GET /discovery/ucp
GET /discovery/well-known
```

Response format:
```json
{
  "protocol": "ucp/1.0",
  "version": "1.0",
  "network": "multiversx-devnet",
  "escrowContract": "erd1...",
  "services": [
    {
      "id": "svc-abc123",
      "name": "DataFetch Pro",
      "endpoint": "https://...",
      "paymentProtocol": "x402",
      "paymentToken": "EGLD",
      "priceAmount": "1000000000000000",
      "escrowContract": "erd1...",
      ...
    }
  ]
}
```

## x402 Payment Flow

1. AI agent calls `GET /discovery/ucp` → gets service list + escrow contract
2. Agent sends `createTask` tx to escrow contract with EGLD
3. Agent calls `POST /tasks` with `escrowTxHash` in body
4. Backend verifies escrow tx on-chain via SC MCP `mvx_tx_decode`
5. Backend executes task and calls `completeTask` on escrow contract
6. Escrow auto-releases EGLD to provider

## Safety Rails

- All write operations (`mvx_sc_call`) use `confirmWrite: true`
- Backend wallet should have minimal EGLD (gas only)
- Set `X402_REQUIRE_ESCROW=true` in production
- Never commit PEM files — use environment variables
