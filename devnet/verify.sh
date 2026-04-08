#!/usr/bin/env bash
# =============================================================================
# AgentBazaar — Post-deploy verification
# Queries all 3 contracts to confirm they are live
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JSON="$SCRIPT_DIR/deployed-addresses.json"
PROXY="https://devnet-api.multiversx.com"

if [[ ! -f "$JSON" ]]; then
  echo -e "${RED}✗ deployed-addresses.json not found. Run deploy.sh first.${NC}"
  exit 1
fi

REGISTRY=$(python3  -c "import json; d=json.load(open('$JSON')); print(d['contracts']['registry'])")
REPUTATION=$(python3 -c "import json; d=json.load(open('$JSON')); print(d['contracts']['reputation'])")
ESCROW=$(python3    -c "import json; d=json.load(open('$JSON')); print(d['contracts']['escrow'])")

echo -e "${BOLD}${CYAN}AgentBazaar — Contract Verification${NC}"
echo ""

check_contract() {
  local name="$1" addr="$2"
  echo -ne "  Checking $name ($addr)... "
  local result
  result=$(curl -sf "$PROXY/accounts/$addr" 2>/dev/null || echo "{}")
  local code_hash
  code_hash=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('codeHash',''))" 2>/dev/null || echo "")
  if [[ -n "$code_hash" && "$code_hash" != "null" && "$code_hash" != "" ]]; then
    echo -e "${GREEN}✓ LIVE (codeHash: ${code_hash:0:16}...)${NC}"
  else
    echo -e "${RED}✗ Not found or no code${NC}"
  fi
}

check_contract "Registry"   "$REGISTRY"
check_contract "Reputation" "$REPUTATION"
check_contract "Escrow"     "$ESCROW"

echo ""
echo -e "${BOLD}Explorer:${NC}"
echo -e "  ${CYAN}https://devnet-explorer.multiversx.com/accounts/$REGISTRY${NC}"
echo -e "  ${CYAN}https://devnet-explorer.multiversx.com/accounts/$REPUTATION${NC}"
echo -e "  ${CYAN}https://devnet-explorer.multiversx.com/accounts/$ESCROW${NC}"
echo ""

# Query Registry: getMarketplaceFeeBps
echo -e "${BOLD}Query Registry.getMarketplaceFeeBps:${NC}"
mxpy contract query "$REGISTRY" \
  --proxy="$PROXY" \
  --function="getMarketplaceFeeBps" 2>/dev/null || echo "  (query failed — contract may still be indexing)"
echo ""
