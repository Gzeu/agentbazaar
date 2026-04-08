#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AgentBazaar — Devnet Interaction Script
# Calls: registerService, createTask, releaseEscrow, updateReputation
# Usage: ./devnet/interact.sh --pem /path/to/wallet.pem --action registerService
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROXY="https://devnet-gateway.multiversx.com"
CHAIN="D"

CONFIG_FILE="devnet/multiversx.json"
REGISTRY=$(jq -r '.contracts.registry' $CONFIG_FILE)
ESCROW=$(jq  -r '.contracts.escrow'   $CONFIG_FILE)
REPUTATION=$(jq -r '.contracts.reputation' $CONFIG_FILE)

PEM=""
ACTION=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --pem)    PEM="$2";    shift 2 ;;
    --action) ACTION="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

case $ACTION in
  registerService)
    echo "📌 Registering demo service on devnet..."
    mxpy contract call $REGISTRY \
      --proxy=$PROXY --chain=$CHAIN --pem=$PEM \
      --gas-limit=10000000 \
      --value=50000000000000000 \
      --function=registerService \
      --arguments \
        str:demo-data-fetcher-v1 \
        str:"Demo Data Fetcher" \
        str:data-fetching \
        str:"https://api.agentbazaar.io/v1/data-fetcher" \
        str:per-request \
        1000000000000000 \
        500 \
        9500 \
        true true \
        str:"bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu" \
      --send --wait-result
    echo "✅ Service registered!"
    ;;
  createTask)
    echo "📌 Creating demo task (escrow)..."
    mxpy contract call $ESCROW \
      --proxy=$PROXY --chain=$CHAIN --pem=$PEM \
      --gas-limit=15000000 \
      --value=1000000000000000 \
      --function=createTask \
      --arguments \
        str:task-001 \
        str:demo-data-fetcher-v1 \
        str:"QmFetchPrice:EGLD/USDC" \
      --send --wait-result
    echo "✅ Task created in escrow!"
    ;;
  getService)
    echo "🔍 Querying registry for service..."
    mxpy contract query $REGISTRY \
      --proxy=$PROXY \
      --function=getService \
      --arguments str:demo-data-fetcher-v1
    ;;
  getTask)
    echo "🔍 Querying escrow for task..."
    mxpy contract query $ESCROW \
      --proxy=$PROXY \
      --function=getTask \
      --arguments str:task-001
    ;;
  *)
    echo "Available actions: registerService | createTask | getService | getTask"
    ;;
esac
