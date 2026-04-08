# Service Descriptor Specification v1

Fiecare serviciu publicat pe AgentBazaar trebuie să respecte această specificație.

## Schema JSON

```json
{
  "id": "uuid-v4",
  "name": "string (max 64 chars)",
  "description": "string (max 256 chars)",
  "category": "data-fetching | compute-offload | wallet-actions | compliance | enrichment | orchestration | notifications",
  "version": "semver (e.g. 1.0.0)",
  "provider": "erd1... (MultiversX address)",
  "endpoint": "https://... (MCP-compatible)",
  "pricing": {
    "model": "per_request | per_second | per_result | subscription",
    "amount": "decimal string",
    "token": "EGLD or ESDT identifier"
  },
  "sla": {
    "max_latency_ms": "integer",
    "uptime_guarantee": "0.0 - 1.0"
  },
  "input_schema": "JSON Schema object",
  "output_schema": "JSON Schema object",
  "mandate_requirements": {
    "ap2_scope": ["read", "write", "execute"],
    "max_spend_per_session": "decimal string + token"
  },
  "ucp_compatible": "boolean",
  "mcp_compatible": "boolean",
  "tags": ["string"],
  "created_at": "ISO 8601",
  "stake": "decimal string + token"
}
```

## Validare

- `id` trebuie să fie unic pe marketplace
- `stake` minim variază per categorie (detalii în Registry contract)
- `endpoint` trebuie să respecte MCP interface spec
- Descriptorii sunt stocați off-chain (IPFS/Arweave), cu hash-ul pe-chain în Registry
