#!/usr/bin/env bash
# =============================================================================
# AgentBazaar — Auto-patch .env files with deployed contract addresses
# Usage: bash devnet/update-env.sh <registry> <reputation> <escrow>
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

REGISTRY="${1:-}"
REPUTATION="${2:-}"
ESCROW="${3:-}"

if [[ -z "$REGISTRY" || -z "$REPUTATION" || -z "$ESCROW" ]]; then
  # Try reading from deployed-addresses.json
  JSON="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/deployed-addresses.json"
  if [[ -f "$JSON" ]]; then
    REGISTRY=$(python3  -c "import json; d=json.load(open('$JSON')); print(d['contracts']['registry'])")
    REPUTATION=$(python3 -c "import json; d=json.load(open('$JSON')); print(d['contracts']['reputation'])")
    ESCROW=$(python3    -c "import json; d=json.load(open('$JSON')); print(d['contracts']['escrow'])")
  else
    echo "Usage: $0 <registry_addr> <reputation_addr> <escrow_addr>"
    exit 1
  fi
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

patch_env() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo -e "  ${YELLOW}⚠  Not found: $file — skipping${NC}"
    return
  fi

  # Update or append each key
  update_key() {
    local key="$1" val="$2"
    if grep -q "^${key}=" "$file"; then
      sed -i.bak "s|^${key}=.*|${key}=${val}|" "$file" && rm -f "${file}.bak"
    else
      echo "${key}=${val}" >> "$file"
    fi
  }

  update_key "REGISTRY_CONTRACT_ADDRESS"   "$REGISTRY"
  update_key "ESCROW_CONTRACT_ADDRESS"     "$ESCROW"
  update_key "REPUTATION_CONTRACT_ADDRESS" "$REPUTATION"
  # Frontend env vars
  update_key "NEXT_PUBLIC_REGISTRY_CONTRACT"   "$REGISTRY"
  update_key "NEXT_PUBLIC_ESCROW_CONTRACT"     "$ESCROW"
  update_key "NEXT_PUBLIC_REPUTATION_CONTRACT" "$REPUTATION"

  echo -e "  ${GREEN}✓ Patched: $file${NC}"
}

echo "Patching .env files..."
patch_env "$ROOT/apps/frontend/temp-frontend/.env.local"
patch_env "$ROOT/apps/backend/.env"
patch_env "$ROOT/.env"

echo ""
echo -e "${GREEN}Addresses written:${NC}"
echo "  REGISTRY_CONTRACT_ADDRESS   = $REGISTRY"
echo "  REPUTATION_CONTRACT_ADDRESS = $REPUTATION"
echo "  ESCROW_CONTRACT_ADDRESS     = $ESCROW"
