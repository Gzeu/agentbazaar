#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AgentBazaar — Devnet Health Check
# Verifies devnet is reachable and contracts are live.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROXY="https://devnet-gateway.multiversx.com"
API="https://devnet-api.multiversx.com"
CONFIG_FILE="devnet/multiversx.json"

echo "🏥 AgentBazaar Devnet Health Check"
echo "====================================="

# Check devnet gateway
STATUS=$(curl -sf "$PROXY/network/status/1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('status',{}).get('erd_current_round','?'))" 2>/dev/null || echo "unreachable")
if [[ "$STATUS" == "unreachable" ]]; then
  echo "❌ Devnet gateway unreachable: $PROXY"
  exit 1
fi
echo "✅ Devnet gateway: round $STATUS"

# Check contract addresses in config
if [[ -f "$CONFIG_FILE" ]]; then
  REGISTRY=$(jq -r '.contracts.registry' $CONFIG_FILE)
  ESCROW=$(jq  -r '.contracts.escrow'   $CONFIG_FILE)
  REPUTATION=$(jq -r '.contracts.reputation' $CONFIG_FILE)

  check_contract() {
    local NAME=$1
    local ADDR=$2
    if [[ -z "$ADDR" || "$ADDR" == "null" || "$ADDR" == "" ]]; then
      echo "⚠️  $NAME: not deployed yet"
      return
    fi
    local CODE=$(curl -sf "$API/accounts/$ADDR" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if d.get('data',{}).get('account',{}).get('code','') != '' else 'no-code')" 2>/dev/null || echo "error")
    if [[ "$CODE" == "ok" ]]; then
      echo "✅ $NAME contract live: $ADDR"
    else
      echo "❌ $NAME contract not found or empty: $ADDR"
    fi
  }

  check_contract "Registry"   "$REGISTRY"
  check_contract "Escrow"     "$ESCROW"
  check_contract "Reputation" "$REPUTATION"
else
  echo "⚠️  $CONFIG_FILE not found — contracts not deployed yet"
fi

echo ""
echo "🔗 Devnet Resources:"
echo "   Gateway : $PROXY"
echo "   API     : $API"
echo "   Explorer: https://devnet-explorer.multiversx.com"
echo "   Faucet  : https://devnet-wallet.multiversx.com/faucet"
