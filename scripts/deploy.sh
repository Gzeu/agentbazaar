#!/bin/bash
set -e

NETWORK="${1:-devnet}"
WALLET="${2:-./devnet/wallet.pem}"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   AgentBazaar — Deploy Script            ║"
echo "╚══════════════════════════════════════════╝"
echo "  Network : $NETWORK"
echo "  Wallet  : $WALLET"
echo ""

# Validate wallet exists
if [ ! -f "$WALLET" ]; then
  echo "❌ Wallet not found at $WALLET"
  echo "   Generate one with: mxpy wallet new --format pem --outfile $WALLET"
  exit 1
fi

# Set chain ID and proxy based on network
case $NETWORK in
  devnet)
    CHAIN_ID="D"
    PROXY="https://devnet-api.multiversx.com"
    ;;
  testnet)
    CHAIN_ID="T"
    PROXY="https://testnet-api.multiversx.com"
    ;;
  mainnet)
    CHAIN_ID="1"
    PROXY="https://api.multiversx.com"
    echo "⚠️  Deploying to MAINNET. Press Ctrl+C to cancel, Enter to continue..."
    read
    ;;
  *)
    echo "❌ Unknown network: $NETWORK. Use devnet, testnet, or mainnet."
    exit 1
    ;;
esac

# Build all contracts
echo "📦 Building contracts..."
mxpy contract build ./contracts/registry   || { echo "❌ Registry build failed"; exit 1; }
mxpy contract build ./contracts/escrow     || { echo "❌ Escrow build failed"; exit 1; }
mxpy contract build ./contracts/reputation || { echo "❌ Reputation build failed"; exit 1; }
echo "✅ All contracts built"

# Deploy Registry
echo ""
echo "📋 Deploying Registry contract..."
REGISTRY_OUT=$(mxpy contract deploy \
  --bytecode ./contracts/registry/output/registry.wasm \
  --pem "$WALLET" \
  --gas-limit 100000000 \
  --proxy "$PROXY" \
  --chain "$CHAIN_ID" \
  --send \
  --outfile ./devnet/registry-deploy.json 2>&1)
REGISTRY_ADDR=$(cat ./devnet/registry-deploy.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('contractAddress',''))" 2>/dev/null || echo "")
if [ -z "$REGISTRY_ADDR" ]; then
  echo "⚠️  Could not parse registry address — check ./devnet/registry-deploy.json"
else
  echo "✅ Registry: $REGISTRY_ADDR"
fi

# Deploy Escrow (requires registry address as constructor arg)
echo ""
echo "🔒 Deploying Escrow contract..."
ESCROW_OUT=$(mxpy contract deploy \
  --bytecode ./contracts/escrow/output/escrow.wasm \
  --pem "$WALLET" \
  --arguments "str:${REGISTRY_ADDR}" \
  --gas-limit 100000000 \
  --proxy "$PROXY" \
  --chain "$CHAIN_ID" \
  --send \
  --outfile ./devnet/escrow-deploy.json 2>&1)
ESCROW_ADDR=$(cat ./devnet/escrow-deploy.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('contractAddress',''))" 2>/dev/null || echo "")
if [ -z "$ESCROW_ADDR" ]; then
  echo "⚠️  Could not parse escrow address — check ./devnet/escrow-deploy.json"
else
  echo "✅ Escrow: $ESCROW_ADDR"
fi

# Deploy Reputation (min stake = 0.1 EGLD = 100000000000000000)
echo ""
echo "⭐ Deploying Reputation contract..."
REPUTATION_OUT=$(mxpy contract deploy \
  --bytecode ./contracts/reputation/output/reputation.wasm \
  --pem "$WALLET" \
  --arguments "100000000000000000" \
  --gas-limit 100000000 \
  --proxy "$PROXY" \
  --chain "$CHAIN_ID" \
  --send \
  --outfile ./devnet/reputation-deploy.json 2>&1)
REPUTATION_ADDR=$(cat ./devnet/reputation-deploy.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('contractAddress',''))" 2>/dev/null || echo "")
if [ -z "$REPUTATION_ADDR" ]; then
  echo "⚠️  Could not parse reputation address — check ./devnet/reputation-deploy.json"
else
  echo "✅ Reputation: $REPUTATION_ADDR"
fi

# Save addresses to config
cat > ./devnet/addresses.json <<EOF
{
  "network": "$NETWORK",
  "chainId": "$CHAIN_ID",
  "registry": "$REGISTRY_ADDR",
  "escrow": "$ESCROW_ADDR",
  "reputation": "$REPUTATION_ADDR",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Deploy complete!                    ║"
echo "╚══════════════════════════════════════════╝"
echo "  Registry   : $REGISTRY_ADDR"
echo "  Escrow     : $ESCROW_ADDR"
echo "  Reputation : $REPUTATION_ADDR"
echo "  Saved to   : ./devnet/addresses.json"
echo ""
