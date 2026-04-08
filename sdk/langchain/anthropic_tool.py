"""
AgentBazaar Anthropic Tool Schema
Pentru integrare directă cu Claude tool_use API.

Usage:
    from anthropic_tool import AGENTBAZAAR_TOOLS, handle_tool_call
    response = client.messages.create(
        model="claude-opus-4",
        tools=AGENTBAZAAR_TOOLS,
        messages=[{"role": "user", "content": "Find me a data service"}]
    )
"""
import asyncio
import json
import sys
sys.path.insert(0, "../python")
from agentbazaar import AgentBazaarClient, DiscoveryQuery

AGENTBAZAAR_URL = "http://localhost:3001"

AGENTBAZAAR_TOOLS = [
    {
        "name": "agentbazaar_discover",
        "description": "Discover AI agent services on the AgentBazaar marketplace. Returns services with IDs, names, prices and reputation scores.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category":       {"type": "string",  "description": "Service category: data, compute, wallet-actions, compliance, enrichment, orchestration, notifications"},
                "max_latency_ms": {"type": "integer", "description": "Maximum latency in milliseconds"},
                "min_score":      {"type": "number",  "description": "Minimum reputation score 0-100"},
                "ucp_required":   {"type": "boolean", "description": "Require UCP-compatible services"},
            },
        },
    },
    {
        "name": "agentbazaar_buy_task",
        "description": "Purchase a service task on AgentBazaar with EGLD escrow. Returns task ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "service_id":       {"type": "string", "description": "Service ID from discover"},
                "consumer_id":      {"type": "string", "description": "Your erd1... wallet address"},
                "provider_address": {"type": "string", "description": "Provider erd1... address"},
                "budget_egld":      {"type": "number", "description": "Budget in EGLD", "default": 0.001},
            },
            "required": ["service_id", "consumer_id", "provider_address"],
        },
    },
    {
        "name": "agentbazaar_wait_task",
        "description": "Wait for a task to complete. Returns status, latency and proof hash.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID from buy_task"},
                "timeout": {"type": "number",  "description": "Max seconds to wait", "default": 60},
            },
            "required": ["task_id"],
        },
    },
]


async def handle_tool_call(tool_name: str, tool_input: dict) -> str:
    """Handle a tool_use block from Claude and return string result."""
    async with AgentBazaarClient(AGENTBAZAAR_URL) as ab:
        if tool_name == "agentbazaar_discover":
            services = await ab.discover(DiscoveryQuery(
                category=tool_input.get("category"),
                max_latency_ms=tool_input.get("max_latency_ms"),
                min_score=tool_input.get("min_score"),
                ucp_required=tool_input.get("ucp_required", False),
            ))
            return json.dumps([{"id": s.id, "name": s.name, "price": s.price_amount, "score": s.reputation_score} for s in services[:10]])

        elif tool_name == "agentbazaar_buy_task":
            task = await ab.create_task(
                service_id=tool_input["service_id"],
                consumer_id=tool_input["consumer_id"],
                provider_address=tool_input["provider_address"],
                budget_egld=str(tool_input.get("budget_egld", 0.001)),
            )
            return json.dumps({"task_id": task.id, "status": task.status})

        elif tool_name == "agentbazaar_wait_task":
            task = await ab.wait_for_completion(tool_input["task_id"], timeout=tool_input.get("timeout", 60))
            return json.dumps({"status": task.status, "latency_ms": task.latency_ms, "proof_hash": task.proof_hash})

    return json.dumps({"error": f"Unknown tool: {tool_name}"})
