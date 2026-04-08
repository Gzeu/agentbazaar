#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AgentBazaar — Developer Setup Script
# Installs all dependencies needed for devnet development.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "🛠️  AgentBazaar Devnet Setup"
echo "================================"

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "❌ Python3 not found. Please install Python 3.9+"
  exit 1
fi
echo "✅ Python3: $(python3 --version)"

# Check Rust
if ! command -v cargo &> /dev/null; then
  echo "📦 Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source ~/.cargo/env
fi
echo "✅ Rust: $(rustc --version)"

# Install wasm32 target
rustup target add wasm32-unknown-unknown
echo "✅ wasm32-unknown-unknown target installed"

# Install mxpy
echo "📦 Installing mxpy..."
pip3 install multiversx-sdk-cli --quiet
echo "✅ mxpy: $(mxpy --version)"

# Install Node.js deps for SDK
if command -v npm &> /dev/null; then
  echo "📦 Installing SDK dependencies..."
  (cd sdk && npm install --quiet)
  echo "✅ SDK deps installed"
else
  echo "⚠️  npm not found — skipping SDK install. Install Node.js 18+."
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "   1. Generate devnet wallet:"
echo "      mxpy wallet new --format pem --outfile ~/agentbazaar-devnet.pem"
echo ""
echo "   2. Fund wallet from faucet:"
echo "      https://devnet-wallet.multiversx.com/faucet"
echo ""
echo "   3. Deploy contracts:"
echo "      ./devnet/deploy.sh --pem ~/agentbazaar-devnet.pem"
echo ""
echo "   4. Register a service:"
echo "      ./devnet/interact.sh --pem ~/agentbazaar-devnet.pem --action registerService"
echo ""
