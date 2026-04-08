#!/usr/bin/env bash
# =============================================================================
# AgentBazaar — Wallet Setup for Devnet Deploy
# Run once before deploy.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'

WALLET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PEM_FILE="$WALLET_DIR/deployer.pem"

echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   AgentBazaar — Devnet Wallet Setup      ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check mxpy
if ! command -v mxpy &>/dev/null; then
  echo -e "${RED}✗ mxpy not found.${NC}"
  echo ""
  echo "  Install with:"
  echo -e "  ${CYAN}pip3 install multiversx-sdk-cli${NC}"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ mxpy found: $(mxpy --version)${NC}"
echo ""

# Create wallet
if [[ -f "$PEM_FILE" ]]; then
  echo -e "${YELLOW}⚠  Wallet already exists at: $PEM_FILE${NC}"
else
  echo -e "Creating new devnet wallet PEM..."
  mxpy wallet new --format pem --outfile "$PEM_FILE"
  echo -e "${GREEN}✓ Wallet created: $PEM_FILE${NC}"
fi

# Extract address
ADDRESS=$(mxpy wallet convert --in-format=pem --in-file="$PEM_FILE" --out-format=address 2>/dev/null || \
          grep -oP 'erd1[a-z0-9]{58}' "$PEM_FILE" | head -1)

echo ""
echo -e "${BOLD}Deployer address:${NC}"
echo -e "  ${CYAN}$ADDRESS${NC}"
echo ""
echo -e "${BOLD}${YELLOW}>>> Fund this wallet with devnet EGLD:${NC}"
echo ""
echo -e "  Option 1 — Web Faucet:"
echo -e "  ${CYAN}https://devnet-wallet.multiversx.com/faucet${NC}"
echo ""
echo -e "  Option 2 — CLI Faucet:"
echo -e "  ${CYAN}mxpy faucet request --address=$ADDRESS --chain=D${NC}"
echo ""
echo -e "  Option 3 — r/MultiversX Discord #devnet-faucet"
echo ""
echo -e "${BOLD}Minimum needed:${NC} 0.1 EGLD (for 3 contract deploys + gas)"
echo ""
echo -e "After funding, check balance:"
echo -e "  ${CYAN}mxpy account get --address=$ADDRESS --proxy=https://devnet-api.multiversx.com${NC}"
echo ""
echo -e "Then run: ${GREEN}bash devnet/deploy.sh${NC}"
