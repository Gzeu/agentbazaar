# AgentBazaar — Devnet Deploy Guide

## Prerequisites

```bash
# Install mxpy (MultiversX Python CLI)
pip3 install multiversx-sdk-cli

# Verify
mxpy --version
```

## Wallet Setup (Devnet)

```bash
# Generate a new devnet wallet
mxpy wallet new --format pem --outfile ~/agentbazaar-devnet.pem

# Fund it from devnet faucet
# https://devnet-wallet.multiversx.com/faucet
# Or via: https://r3d4.fr/faucet
```

## Deploy All Contracts

```bash
chmod +x devnet/deploy.sh
./devnet/deploy.sh --pem ~/agentbazaar-devnet.pem
```

Deploy-ul face automat:
1. Build WASM pentru toate 3 contracte
2. Deploy Registry → Escrow → Reputation în ordine corectă
3. Actualizează `devnet/multiversx.json` cu adresele obținute

## Interact

```bash
chmod +x devnet/interact.sh

# Înregistrează un serviciu demo
./devnet/interact.sh --pem ~/agentbazaar-devnet.pem --action registerService

# Creează un task cu escrow
./devnet/interact.sh --pem ~/agentbazaar-devnet.pem --action createTask

# Query serviciu
./devnet/interact.sh --pem ~/agentbazaar-devnet.pem --action getService

# Query task
./devnet/interact.sh --pem ~/agentbazaar-devnet.pem --action getTask
```

## Contract Addresses (după deploy)

Adresele sunt salvate automat în `devnet/multiversx.json` sub cheia `.contracts`.

## Explorer Links

- Devnet Explorer: https://devnet-explorer.multiversx.com
- Devnet API: https://devnet-api.multiversx.com
- Devnet Faucet: https://devnet-wallet.multiversx.com/faucet

## Contract Architecture

```
Registry Contract
  └── stochează service descriptors, stake providers
  └── emite: serviceRegistered, serviceDeactivated, providerSlashed

Escrow Contract
  └── blochează EGLD per task, release la proof, refund la timeout
  └── apelează Registry.incrementTaskCount după completare
  └── emite: taskCreated, taskCompleted, taskRefunded, disputeOpened

Reputation Contract
  └── calculează scor compozit per provider
  └── poate triggera slash via Registry.slashProvider
  └── emite: reputationUpdated, providerSlashed
```

## Structura Deploy Output

După deploy, vei găsi:
- `devnet/registry-deploy.json` — tx hash + adresă contract
- `devnet/escrow-deploy.json`
- `devnet/reputation-deploy.json`
- `devnet/multiversx.json` — actualizat cu adresele live
