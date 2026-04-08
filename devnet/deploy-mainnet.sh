#!/usr/bin/env bash
# AgentBazaar — Mainnet Deploy Script
# WARNING: Uses real EGLD. Requires security audit completion.
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

echo -e "${RED}"
echo "  ⚠️  WARNING: MAINNET DEPLOY — USES REAL EGLD"
echo "  Ensure security audit is complete before proceeding."
echo -e "${NC}"
read -rp "Type 'MAINNET' to confirm: " CONFIRM
[[ "$CONFIRM" != 'MAINNET' ]] && echo 'Aborted.' && exit 1

PEM_FILE="${PEM_FILE:-~/agentbazaar-mainnet.pem}"
CHAIN="1"
API="https://api.multiversx.com"
GATEWAY="https://gateway.multiversx.com"
OUT_FILE="devnet/mainnet-deployed-addresses.json"

[[ ! -f "$PEM_FILE" ]] && echo -e "${RED}PEM not found: $PEM_FILE${NC}" && exit 1

echo -e "${YELLOW}Building contracts...${NC}"
cd contracts/registry   && sc-meta all build && cd ../..
cd contracts/reputation && sc-meta all build && cd ../..
cd contracts/escrow     && sc-meta all build && cd ../..

# Deploy Registry
echo -e "${YELLOW}[1/3] Deploying Registry...${NC}"
REGISTRY_RESULT=$(mxpy contract deploy \
  --bytecode contracts/registry/output/registry.wasm \
  --pem "$PEM_FILE" \
  --chain "$CHAIN" \
  --proxy "$GATEWAY" \
  --gas-limit 150000000 \
  --arguments 250 \
  --send --recall-nonce --outfile /tmp/registry-mainnet.json 2>&1)
REGISTRY_ADDR=$(python3 -c "import json,sys; print(json.load(open('/tmp/registry-mainnet.json'))['emittedTransactionHash'])" 2>/dev/null || echo 'FAILED')
echo -e "Registry TX: ${GREEN}$REGISTRY_ADDR${NC}"

sleep 10

# Continue pattern same as devnet/deploy.sh ...
echo -e "${GREEN}Mainnet deploy initiated. Monitor at https://explorer.multiversx.com${NC}"
echo -e "${YELLOW}Populate $OUT_FILE manually with contract addresses from explorer.${NC}"
