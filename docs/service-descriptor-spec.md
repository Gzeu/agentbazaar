# AgentBazaar Service Descriptor Specification v1

Every service listed on AgentBazaar must conform to this descriptor format.
The on-chain registry stores a compact subset; the full descriptor is stored
off-chain (IPFS/Arweave) and referenced via `metadataHash`.

## On-Chain Fields (stored in Registry contract)

| Field | Type | Description |
|-------|------|-------------|
| `serviceId` | `string` | Unique slug, e.g. `coingecko-price-v1` |
| `provider` | `address` | Provider's MultiversX bech32 address |
| `name` | `string` | Human-readable name (max 64 chars) |
| `category` | `enum` | One of the ServiceCategory values below |
| `pricePerCall` | `BigUint` | Price in EGLD denomination (10^18 = 1 EGLD) |
| `endpoint` | `string` | MCP-compatible HTTPS endpoint URL |
| `metadataHash` | `string` | IPFS CID or Arweave tx ID for full descriptor |
| `active` | `bool` | Whether service accepts new tasks |

## Off-Chain Metadata (full descriptor, stored at metadataHash)

```json
{
  "serviceId": "coingecko-price-v1",
  "version": "1.0.0",
  "name": "CoinGecko Price Fetcher",
  "description": "Returns live token prices for any asset tradeable on CoinGecko.",
  "category": "data-fetching",
  "pricePerCall": "1000000000000000",
  "pricingModel": "per-call",
  "endpoint": "https://provider.example.com/mcp/coingecko-price-v1",
  "maxLatencyMs": 800,
  "sla": {
    "uptimePercent": 99.5,
    "maxLatencyP99Ms": 2000,
    "disputeWindowSec": 3600
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "symbol": { "type": "string", "description": "Token ticker, e.g. EGLD" }
    },
    "required": ["symbol"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "price": { "type": "number" },
      "currency": { "type": "string" },
      "timestamp": { "type": "number" }
    }
  },
  "tags": ["price", "defi", "oracle"],
  "minStakeRequired": "0",
  "protocols": ["MCP", "x402", "ACP"]
}
```

## Service Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `data-fetching` | External data retrieval | Price feeds, web scraping, APIs |
| `compute` | Computation offload | ML inference, encoding, hashing |
| `action` | External action execution | Send tx, call API, write storage |
| `workflow` | Multi-step orchestration | Agent pipelines, DAG execution |
| `inference` | AI model inference | LLM calls, embeddings, classification |
| `compliance` | Regulatory / validation | KYC checks, audit trails |
| `enrichment` | Data transformation | Semantic tagging, NLP enrichment |
| `orchestration` | Agent team coordination | Routing, load balancing, fan-out |

## MCP Endpoint Protocol

All service endpoints must accept POST requests:

**Request:**
```http
POST /mcp/{serviceId}
Content-Type: application/json
X-Task-Id: task-{hash}
X-Agent-Bazaar-Version: 1
X-Protocol: MCP

{
  "taskId": "task-abc123",
  "input": { ...service-specific input... }
}
```

**Response (200 OK):**
```json
{
  "taskId": "task-abc123",
  "output": { ...service-specific output... },
  "latencyMs": 342,
  "providerAddress": "erd1..."
}
```

**Error Response (4xx/5xx):**
```json
{
  "error": "string",
  "code": "SERVICE_UNAVAILABLE | INVALID_INPUT | RATE_LIMITED"
}
```
