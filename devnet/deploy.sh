#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AgentBazaar — Devnet Deploy Script
# Usage: ./devnet/deploy.sh --pem /path/to/wallet.pem
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROXY="https://devnet-gateway.multiversx.com"
CHAIN="D"
GAS_REGISTRY=80000000
GAS_ESCROW=100000000
GAS_REPUTATION=80000000
MIN_STAKE="50000000000000000"  # 0.05 EGLD in wei
FEE_BPS=100                    # 1%
DISPUTE_WINDOW=3600
TASK_TIMEOUT=300

PEM=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --pem) PEM="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$PEM" ]]; then
  echo "ERROR: --pem <wallet.pem> is required"
  exit 1
fi

echo "🔨 Building contracts..."
(cd contracts/registry  && mxpy contract build)
(cd contracts/escrow    && mxpy contract build)
(cd contracts/reputation && mxpy contract build)

echo ""
echo "🚀 Deploying Registry contract..."
REGISTRY_ADDR=$(mxpy contract deploy \
  --bytecode=contracts/registry/output/registry.wasm \
  --proxy=$PROXY \
  --chain=$CHAIN \
  --pem=$PEM \
  --gas-limit=$GAS_REGISTRY \
  --arguments $MIN_STAKE $FEE_BPS \
  --outfile=devnet/registry-deploy.json \
  --wait-result \
  --send \
  2>&1 | grep -oP '(?<=Contract address: )\S+')
echo "✅ Registry deployed at: $REGISTRY_ADDR"

echo ""
echo "🚀 Deploying Escrow contract..."
ESCROW_ADDR=$(mxpy contract deploy \
  --bytecode=contracts/escrow/output/escrow.wasm \
  --proxy=$PROXY \
  --chain=$CHAIN \
  --pem=$PEM \
  --gas-limit=$GAS_ESCROW \
  --arguments $REGISTRY_ADDR $DISPUTE_WINDOW $TASK_TIMEOUT \
  --outfile=devnet/escrow-deploy.json \
  --wait-result \
  --send \
  2>&1 | grep -oP '(?<=Contract address: )\S+')
echo "✅ Escrow deployed at: $ESCROW_ADDR"

echo ""
echo "🚀 Deploying Reputation contract..."
REPUTATION_ADDR=$(mxpy contract deploy \
  --bytecode=contracts/reputation/output/reputation.wasm \
  --proxy=$PROXY \
  --chain=$CHAIN \
  --pem=$PEM \
  --gas-limit=$GAS_REPUTATION \
  --arguments $REGISTRY_ADDR $ESCROW_ADDR \
  --outfile=devnet/reputation-deploy.json \
  --wait-result \
  --send \
  2>&1 | grep -oP '(?<=Contract address: )\S+')
echo "✅ Reputation deployed at: $REPUTATION_ADDR"

echo ""
echo "📋 Updating devnet/multiversx.json with deployed addresses..."
jq \
  --arg r "$REGISTRY_ADDR" \
  --arg e "$ESCROW_ADDR" \
  --arg rep "$REPUTATION_ADDR" \
  '.contracts.registry=$r | .contracts.escrow=$e | .contracts.reputation=$rep' \
  devnet/multiversx.json > devnet/multiversx.tmp.json && mv devnet/multiversx.tmp.json devnet/multiversx.json

echo ""
echo "🎉 AgentBazaar Devnet Deploy Complete!"
echo "   Registry   : $REGISTRY_ADDR"
echo "   Escrow     : $ESCROW_ADDR"
echo "   Reputation : $REPUTATION_ADDR"
echo ""
echo "🔗 Explorer:"
echo "   https://devnet-explorer.multiversx.com/accounts/$REGISTRY_ADDR"
echo "   https://devnet-explorer.multiversx.com/accounts/$ESCROW_ADDR"
echo "   https://devnet-explorer.multiversx.com/accounts/$REPUTATION_ADDR"
