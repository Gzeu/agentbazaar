#!/usr/bin/env bash
# =============================================================================
# AgentBazaar — Automated Devnet Deploy
# Deploys: Registry → Reputation → Escrow (order matters!)
# Usage: bash devnet/deploy.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$ROOT_DIR/contracts"
OUTPUT_FILE="$SCRIPT_DIR/deployed-addresses.json"
PEM_FILE="$SCRIPT_DIR/deployer.pem"
PROXY="https://devnet-api.multiversx.com"
CHAIN="D"

echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║   AgentBazaar — Devnet Deploy v1.0               ║"
echo "  ║   Registry → Reputation → Escrow                 ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Preflight checks ────────────────────────────────────────────────────────

if ! command -v mxpy &>/dev/null; then
  echo -e "${RED}✗ mxpy not installed. Run: pip3 install multiversx-sdk-cli${NC}"
  exit 1
fi

if [[ ! -f "$PEM_FILE" ]]; then
  echo -e "${RED}✗ Wallet PEM not found at $PEM_FILE${NC}"
  echo -e "  Run first: ${CYAN}bash devnet/wallet-setup.sh${NC}"
  exit 1
fi

DEPLOYER=$(grep -oP 'erd1[a-z0-9]{58}' "$PEM_FILE" | head -1 || \
           mxpy wallet convert --in-format=pem --in-file="$PEM_FILE" --out-format=address 2>/dev/null)
echo -e "${BOLD}Deployer:${NC} $DEPLOYER"

# Check balance
BALANCE_RAW=$(mxpy account get --address="$DEPLOYER" --proxy="$PROXY" 2>/dev/null | grep -o '"balance":"[^"]*"' | grep -o '[0-9]*' || echo "0")
if [[ "${BALANCE_RAW:-0}" == "0" ]]; then
  echo -e "${YELLOW}⚠  Could not verify balance (API may be slow). Continuing...${NC}"
else
  echo -e "${GREEN}✓ Balance: $(echo "scale=6; $BALANCE_RAW / 1000000000000000000" | bc) EGLD${NC}"
fi

echo ""

# ── Build WASM ───────────────────────────────────────────────────────────────

build_contract() {
  local name=$1
  local dir="$CONTRACTS_DIR/$name"
  local wasm="$dir/output/$name.wasm"

  echo -e "${BOLD}[BUILD]${NC} $name..."

  if [[ -f "$wasm" ]]; then
    echo -e "  ${GREEN}✓ WASM already built: $wasm${NC}"
    return
  fi

  cd "$dir"
  if command -v sc-meta &>/dev/null; then
    sc-meta all build 2>&1 | tail -5
  else
    mxpy contract build 2>&1 | tail -5
  fi
  cd "$ROOT_DIR"

  if [[ -f "$wasm" ]]; then
    echo -e "  ${GREEN}✓ Built: $wasm${NC}"
  else
    echo -e "  ${RED}✗ Build failed for $name — WASM not found${NC}"
    exit 1
  fi
}

build_contract "registry"
build_contract "reputation"
build_contract "escrow"

echo ""

# ── Deploy helper ────────────────────────────────────────────────────────────

deploy_contract() {
  local name=$1
  local wasm="$CONTRACTS_DIR/$name/output/$name.wasm"
  shift
  local args=("$@")

  echo -e "${BOLD}[DEPLOY]${NC} $name..."

  local args_str=""
  if [[ ${#args[@]} -gt 0 ]]; then
    args_str=$(printf "%s" "${args[@]}")
  fi

  local deploy_cmd=(mxpy contract deploy
    --bytecode="$wasm"
    --pem="$PEM_FILE"
    --proxy="$PROXY"
    --chain="$CHAIN"
    --gas-limit=100000000
    --send
    --outfile="$SCRIPT_DIR/${name}-deploy.json")

  if [[ -n "$args_str" ]]; then
    deploy_cmd+=(--arguments $args_str)
  fi

  "${deploy_cmd[@]}" 2>&1 | tail -10

  local addr
  addr=$(python3 -c "
import json, sys
with open('$SCRIPT_DIR/${name}-deploy.json') as f:
    d = json.load(f)
print(d.get('contractAddress', d.get('emittedTransactionHash', '')))
" 2>/dev/null || echo "")

  if [[ -z "$addr" ]]; then
    # Try to parse from logs
    addr=$(grep -oP '"contractAddress":"\K[^"]+' "$SCRIPT_DIR/${name}-deploy.json" 2>/dev/null || echo "")
  fi

  if [[ -z "$addr" || "$addr" == "0x"* ]]; then
    echo -e "  ${RED}✗ Could not parse contract address from deploy output${NC}"
    echo -e "  Check: ${CYAN}$SCRIPT_DIR/${name}-deploy.json${NC}"
    exit 1
  fi

  echo -e "  ${GREEN}✓ Deployed: $addr${NC}"
  echo "$addr"
}

# ── 1. Deploy Registry ───────────────────────────────────────────────────────
echo -e "${BOLD}Step 1/3 — Registry Contract${NC}"
echo -e "  constructor: marketplace_fee_bps = 250 (2.5%)"
REGISTRY_ADDR=$(deploy_contract "registry" "0x00000000000000FA")  # 250 in hex
echo ""

# ── 2. Deploy Reputation ─────────────────────────────────────────────────────
echo -e "${BOLD}Step 2/3 — Reputation Contract${NC}"
echo -e "  constructor: escrow_address = (will be updated via setEscrow after step 3)"
# Deploy with placeholder — escrow address wired after
REPUTATION_ADDR=$(deploy_contract "reputation" "0x0000000000000000000000000000000000000000000000000000000000000000")
echo ""

# ── 3. Deploy Escrow ─────────────────────────────────────────────────────────
echo -e "${BOLD}Step 3/3 — Escrow Contract${NC}"
echo -e "  constructor: registry=$REGISTRY_ADDR, reputation=$REPUTATION_ADDR"

# Convert bech32 addresses to hex for constructor
convert_addr() {
  python3 -c "
import sys
try:
    from multiversx_sdk import Address
    print('0x' + Address.from_bech32('$1').hex())
except Exception:
    # fallback: bech32 decode manually
    import struct
    alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
    data = '$1'
    hrp, dp = data.split('1', 1)
    decoded = [alphabet.index(c) for c in dp]
    # convert 5-bit groups to 8-bit
    acc, bits, result = 0, 0, []
    for value in decoded[:-6]:
        acc = ((acc << 5) | value)
        bits += 5
        while bits >= 8:
            bits -= 8
            result.append((acc >> bits) & 0xff)
    print('0x' + ''.join(f'{b:02x}' for b in result))
" 2>/dev/null || echo "$1"
}

REGISTRY_HEX=$(convert_addr "$REGISTRY_ADDR")
REPUTATION_HEX=$(convert_addr "$REPUTATION_ADDR")

ESCROW_ADDR=$(deploy_contract "escrow" "$REGISTRY_HEX" "$REPUTATION_HEX")
echo ""

# ── Save addresses ────────────────────────────────────────────────────────────
echo -e "${BOLD}Saving deployed addresses...${NC}"
cat > "$OUTPUT_FILE" <<EOF
{
  "network": "devnet",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$DEPLOYER",
  "contracts": {
    "registry":   "$REGISTRY_ADDR",
    "reputation": "$REPUTATION_ADDR",
    "escrow":     "$ESCROW_ADDR"
  }
}
EOF

echo -e "  ${GREEN}✓ Saved to $OUTPUT_FILE${NC}"
echo ""

# ── Update .env files ─────────────────────────────────────────────────────────
echo -e "${BOLD}Patching .env files...${NC}"
bash "$SCRIPT_DIR/update-env.sh" "$REGISTRY_ADDR" "$REPUTATION_ADDR" "$ESCROW_ADDR"
echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
echo -e "${BOLD}${GREEN}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║   ✅  DEPLOY COMPLETE                                 ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}Registry:${NC}   $REGISTRY_ADDR"
echo -e "  ${BOLD}Reputation:${NC} $REPUTATION_ADDR"
echo -e "  ${BOLD}Escrow:${NC}     $ESCROW_ADDR"
echo ""
echo -e "  ${BOLD}Explorer links:${NC}"
echo -e "  ${CYAN}https://devnet-explorer.multiversx.com/accounts/$REGISTRY_ADDR${NC}"
echo -e "  ${CYAN}https://devnet-explorer.multiversx.com/accounts/$REPUTATION_ADDR${NC}"
echo -e "  ${CYAN}https://devnet-explorer.multiversx.com/accounts/$ESCROW_ADDR${NC}"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "  1. ${CYAN}bash devnet/verify.sh${NC}           — verify contracts on-chain"
echo -e "  2. ${CYAN}cd apps/backend && npm run start:dev${NC} — start API"
echo -e "  3. ${CYAN}cd apps/frontend/temp-frontend && npm run dev${NC} — start UI"
echo ""
