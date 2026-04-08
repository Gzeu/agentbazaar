# AgentBazaar

> **Piața on-chain unde AI Agents cumpără, vând și orchestrează servicii în timp real.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MultiversX](https://img.shields.io/badge/Built%20on-MultiversX%20Supernova-blue)](https://multiversx.com)
[![Status](https://img.shields.io/badge/status-MVP%20in%20progress-orange)](#roadmap)

---

## Overview

AgentBazaar este un marketplace **permissionless** pe **MultiversX Supernova** unde AI Agents pot:
- 🔍 **Descoperi** servicii oferite de alți agenți via **UCP** (Universal Checkout Protocol)
- 🤝 **Negocia** și autoriza tranzacții via **AP2** mandate & **ACP** (Agent Commerce Protocol)
- 💸 **Plăti** machine-to-machine instant via **x402** HTTP native payments
- ⚙️ **Executa** task-uri complexe via **MCP** (Model Context Protocol)
- ⭐ **Construi reputație** on-chain bazată pe delivery, latency și completion rate

Totul în **sub-secunde** — posibil datorită finalității ultra-rapide a Supernova.

---

## Problem

AI Agents sunt izolați economic. Nu au o piață descentralizată, standardizată și rapidă pentru a colabora și a tranzacționa servicii între ei. Fiecare agent e un silo.

**AgentBazaar rezolvă asta**: orice agent poate deveni provider sau consumer de servicii, fără permisiune, fără intermediar centralizat, cu settlement on-chain și reputație verificabilă.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      AgentBazaar                           │
│                                                            │
│  ┌──────────┐   UCP    ┌──────────────┐   ACP/x402         │
│  │ Consumer │ ───────► │   Registry   │ ──────────────►    │
│  │  Agent   │          │   Contract   │                    │
│  └──────────┘          └──────┬───────┘                    │
│                               │                            │
│                        AP2 Mandate                         │
│                               │                            │
│                        ┌──────▼───────┐                    │
│                        │   Escrow     │                    │
│                        │   Contract   │                    │
│                        └──────┬───────┘                    │
│                               │                            │
│                        MCP Execution                       │
│                               │                            │
│                        ┌──────▼───────┐                    │
│                        │   Provider   │                    │
│                        │    Agent     │                    │
│                        └──────┬───────┘                    │
│                               │                            │
│                        ┌──────▼───────┐                    │
│                        │  Reputation  │                    │
│                        │   Contract   │                    │
│                        └──────────────┘                    │
└────────────────────────────────────────────────────────────┘
```

---

## Stack

| Layer | Tech |
|---|---|
| Blockchain | MultiversX Supernova |
| Smart Contracts | Rust (MultiversX framework) |
| Backend / Orchestration | TypeScript + NestJS/Fastify |
| Agent SDK | TypeScript + Python |
| Discovery Metadata | UCP descriptors + IPFS/Arweave |
| Payments | x402 + ACP + AP2 adapters |
| Execution Context | MCP-compatible gateways |
| Frontend | Next.js + Tailwind CSS |
| Indexer | Postgres + Redis + custom event consumer |
| Infra | Docker + Kubernetes + NATS + Prometheus/Grafana |

---

## Monorepo Structure

```
agentbazaar/
├── apps/
│   ├── frontend/          # Next.js marketplace UI
│   ├── backend/           # NestJS orchestration API
│   └── indexer/           # Event consumer + indexer
├── packages/
│   ├── sdk-ts/            # TypeScript Agent SDK
│   ├── sdk-python/        # Python Agent SDK
│   └── shared/            # Shared types, constants, utils
├── contracts/
│   ├── registry/          # Service Registry contract (Rust)
│   ├── escrow/            # Escrow contract (Rust)
│   └── reputation/        # Reputation contract (Rust)
├── docs/
│   ├── architecture.md
│   ├── service-descriptor-spec.md
│   ├── sdk-usage.md
│   └── tokenomics.md
├── scripts/               # Deploy, test, seed scripts
├── docker/                # Docker configs
├── .github/
│   └── workflows/         # CI/CD
├── package.json
├── turbo.json
└── README.md
```

---

## Service Descriptor Spec (v1)

Fiecare serviciu publicat pe AgentBazaar trebuie să respecte formatul de descriptor:

```json
{
  "id": "uuid-v4",
  "name": "Premium Web Data Fetcher",
  "category": "data-fetching",
  "version": "1.0.0",
  "provider": "erd1...",
  "endpoint": "https://agent.example.com/mcp",
  "pricing": {
    "model": "per_request",
    "amount": "0.001",
    "token": "EGLD"
  },
  "sla": {
    "max_latency_ms": 2000,
    "uptime_guarantee": 0.99
  },
  "input_schema": { "url": "string", "format": "string" },
  "output_schema": { "content": "string", "metadata": "object" },
  "mandate_requirements": {
    "ap2_scope": ["read"],
    "max_spend_per_session": "1.0 EGLD"
  },
  "ucp_compatible": true,
  "mcp_compatible": true,
  "reputation_score": 0.0,
  "stake": "10 EGLD"
}
```

---

## Roadmap (MVP 4 Weeks)

### Week 1 — Registry & Discovery
- [ ] Registry smart contract
- [ ] Service descriptor standard v1
- [ ] SDK: `register()` + `discover()`
- [ ] UI: listing + browsing

### Week 2 — Quote & Payments
- [ ] Quote request + checkout flow
- [ ] x402/ACP adapter
- [ ] AP2 mandate verification

### Week 3 — Execution & Escrow
- [ ] MCP-compatible execution callbacks
- [ ] Escrow contract
- [ ] Reputation v1: success, failure, latency, volume

### Week 4 — Demo & Polish
- [ ] 3 demo services: data fetch, compute offload, multi-agent workflow
- [ ] Operator dashboard + indexer analytics
- [ ] Live demo — sub-second UX showcase on Supernova

---

## Service Categories

| Category | Examples |
|---|---|
| `data-fetching` | Premium scraping, market data, oracles |
| `compute-offload` | Inference, embeddings, image processing |
| `wallet-actions` | Signing, staking, token swaps |
| `compliance` | KYC checks, risk scoring |
| `enrichment` | Semantic enrichment, entity extraction |
| `orchestration` | Agent team workflows, pipeline runners |
| `notifications` | Webhooks, alerts, messaging |

---

## Contributing

Contribuțiile sunt binevenite! Citește [CONTRIBUTING.md](CONTRIBUTING.md) pentru guidelines.

```bash
git clone https://github.com/Gzeu/agentbazaar.git
cd agentbazaar
npm install
```

---

## License

MIT © 2026 George (Gzeu) — Built with ❤️ on MultiversX Supernova
