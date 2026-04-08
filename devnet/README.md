# AgentBazaar — Devnet Deploy Guide

Complete guide to deploy all 3 smart contracts to MultiversX Devnet.

## Prerequisites

```bash
# 1. Install mxpy (MultiversX SDK CLI)
pip3 install multiversx-sdk-cli

# 2. Install sc-meta (Rust contract builder)
cargo install multiversx-sc-meta

# 3. Verify
mxpy --version
sc-meta --version
```

## Step 1 — Wallet Setup

```bash
bash devnet/wallet-setup.sh
```

This creates `devnet/deployer.pem` and shows you the deployer address.

### Fund the wallet

You need ~0.1 EGLD for 3 deploys + gas.

**Option A — Web faucet:**
```
https://devnet-wallet.multiversx.com/faucet
```

**Option B — CLI:**
```bash
mxpy faucet request --address=<YOUR_ADDRESS> --chain=D
```

**Verify balance:**
```bash
mxpy account get \
  --address=<YOUR_ADDRESS> \
  --proxy=https://devnet-api.multiversx.com
```

## Step 2 — Deploy All Contracts

```bash
bash devnet/deploy.sh
```

Deploy order (important due to constructor dependencies):

```
1. Registry    (no deps)             → constructor(marketplace_fee_bps: 250)
2. Reputation  (placeholder escrow)  → constructor(escrow_address)
3. Escrow      (needs registry+rep)  → constructor(registry_address, reputation_address)
```

After deploy:
- Addresses saved to `devnet/deployed-addresses.json`
- `.env.local` and `apps/backend/.env` auto-patched

## Step 3 — Verify

```bash
bash devnet/verify.sh
```

Expected output:
```
  Checking Registry   (erd1...)... ✓ LIVE
  Checking Reputation (erd1...)... ✓ LIVE
  Checking Escrow     (erd1...)... ✓ LIVE
```

## Step 4 — Start Services

```bash
# Terminal 1 — Backend API
cd apps/backend
cp .env.example .env   # if .env doesn't exist
npm install
npm run start:dev

# Terminal 2 — Frontend
cd apps/frontend/temp-frontend
cp .env.local.example .env.local   # if .env.local doesn't exist
npm install
npm run dev
```

## Deployed Addresses (after deploy)

> Auto-populated by `deploy.sh` into `deployed-addresses.json`

```json
{
  "network": "devnet",
  "contracts": {
    "registry":   "erd1...",
    "reputation": "erd1...",
    "escrow":     "erd1..."
  }
}
```

## Troubleshooting

### `insufficient funds`
Fund wallet with more EGLD from faucet.

### `contract build failed`
```bash
# Make sure sc-meta is installed
cargo install multiversx-sc-meta

# Build manually
cd contracts/registry && sc-meta all build
cd contracts/reputation && sc-meta all build
cd contracts/escrow && sc-meta all build
```

### `cannot parse contract address`
Check the deploy JSON file:
```bash
cat devnet/registry-deploy.json
```
Look for `contractAddress` field manually and run `update-env.sh` with the addresses.

### WASM already built, skip rebuild
The deploy script detects existing WASM files and skips rebuild. To force rebuild:
```bash
rm contracts/*/output/*.wasm
bash devnet/deploy.sh
```

## Contract ABIs

| Contract | Init Args | Key Endpoints |
|---|---|---|
| Registry | `marketplace_fee_bps: u64` | `registerService`, `getService` |
| Reputation | `escrow_address: Address` | `submitCompletionProof`, `getScore` |
| Escrow | `registry: Address, reputation: Address` | `createTask`, `releaseEscrow` |

## Network Config

| Parameter | Value |
|---|---|
| Network | Devnet |
| Chain ID | `D` |
| Proxy | `https://devnet-api.multiversx.com` |
| Explorer | `https://devnet-explorer.multiversx.com` |
| Faucet | `https://devnet-wallet.multiversx.com/faucet` |
