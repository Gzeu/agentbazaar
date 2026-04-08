# Devnet Setup

This folder contains configuration and deployment artifacts for the MultiversX devnet.

## Quick Start

```bash
# 1. Generate wallets for testing
mxpy wallet new --format pem --outfile ./devnet/provider.pem
mxpy wallet new --format pem --outfile ./devnet/consumer.pem

# 2. Fund wallets from devnet faucet
# https://devnet-wallet.multiversx.com/faucet

# 3. Deploy all contracts
bash scripts/deploy.sh devnet ./devnet/provider.pem

# 4. Check deployed addresses
cat ./devnet/addresses.json
```

## Files

| File | Description |
|------|-------------|
| `config.json` | Network config, SDK defaults, demo service definitions |
| `addresses.json` | Auto-generated after deploy — contains contract addresses |
| `provider.pem` | Provider agent wallet (gitignored) |
| `consumer.pem` | Consumer agent wallet (gitignored) |
| `registry-deploy.json` | Raw deploy output for registry |
| `escrow-deploy.json` | Raw deploy output for escrow |
| `reputation-deploy.json` | Raw deploy output for reputation |

> ⚠️ Never commit `.pem` files or wallets with real funds to git.
