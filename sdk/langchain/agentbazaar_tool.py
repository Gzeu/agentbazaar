"""
AgentBazaar LangChain Tool
Permite oricărui agent LangChain să descopere și să cumpere servicii pe AgentBazaar.

Usage:
    from agentbazaar_tool import AgentBazaarDiscoverTool, AgentBazaarBuyTool
    tools = [AgentBazaarDiscoverTool(), AgentBazaarBuyTool()]
    agent = initialize_agent(tools, llm, agent=AgentType.OPENAI_FUNCTIONS)
"""
import asyncio
import json
from typing import Optional, Type

try:
    from langchain.tools import BaseTool
    from pydantic import BaseModel, Field
except ImportError:
    raise ImportError("Run: pip install langchain pydantic")

import sys
sys.path.insert(0, "../python")
from agentbazaar import AgentBazaarClient, DiscoveryQuery


AGENTBAZAAR_URL = "http://localhost:3001"


class DiscoverInput(BaseModel):
    category:       Optional[str] = Field(None, description="Service category: data, compute, wallet-actions, compliance, enrichment, orchestration, notifications")
    max_latency_ms: Optional[int] = Field(None, description="Maximum acceptable latency in milliseconds")
    min_score:      Optional[float] = Field(None, description="Minimum reputation score 0-100")
    ucp_required:   bool = Field(False, description="Require UCP-compatible services only")


class AgentBazaarDiscoverTool(BaseTool):
    name = "agentbazaar_discover"
    description = (
        "Discover AI agent services available on the AgentBazaar marketplace. "
        "Use this when you need to find a service that can perform a task for you. "
        "Returns a list of services with their IDs, names, prices, and reputation scores."
    )
    args_schema: Type[BaseModel] = DiscoverInput

    def _run(self, category=None, max_latency_ms=None, min_score=None, ucp_required=False):
        return asyncio.run(self._arun(category, max_latency_ms, min_score, ucp_required))

    async def _arun(self, category=None, max_latency_ms=None, min_score=None, ucp_required=False):
        async with AgentBazaarClient(AGENTBAZAAR_URL) as ab:
            services = await ab.discover(DiscoveryQuery(
                category=category,
                max_latency_ms=max_latency_ms,
                min_score=min_score,
                ucp_required=ucp_required,
            ))
        results = [
            {
                "id":               s.id,
                "name":             s.name,
                "category":         s.category,
                "price_amount":     s.price_amount,
                "price_token":      s.price_token,
                "reputation_score": s.reputation_score,
                "max_latency_ms":   s.max_latency_ms,
                "description":      s.description,
            }
            for s in services[:10]
        ]
        return json.dumps(results, indent=2)


class BuyInput(BaseModel):
    service_id:       str   = Field(..., description="The ID of the service to buy")
    consumer_id:      str   = Field(..., description="Your agent's MultiversX wallet address (erd1...)")
    provider_address: str   = Field(..., description="Provider's MultiversX address (erd1...)")
    budget_egld:      float = Field(0.001, description="Maximum budget in EGLD")


class AgentBazaarBuyTool(BaseTool):
    name = "agentbazaar_buy_task"
    description = (
        "Purchase a service task on AgentBazaar. Creates an escrow task and returns a task ID. "
        "Use after agentbazaar_discover to select and buy a service. "
        "Returns task ID and initial status."
    )
    args_schema: Type[BaseModel] = BuyInput

    def _run(self, service_id, consumer_id, provider_address, budget_egld=0.001):
        return asyncio.run(self._arun(service_id, consumer_id, provider_address, budget_egld))

    async def _arun(self, service_id, consumer_id, provider_address, budget_egld=0.001):
        async with AgentBazaarClient(AGENTBAZAAR_URL) as ab:
            task = await ab.create_task(
                service_id=service_id,
                consumer_id=consumer_id,
                provider_address=provider_address,
                budget_egld=str(budget_egld),
            )
        return json.dumps({"task_id": task.id, "status": task.status, "deadline": task.deadline})


class WaitInput(BaseModel):
    task_id: str   = Field(..., description="Task ID to wait for")
    timeout: float = Field(60.0, description="Maximum seconds to wait")


class AgentBazaarWaitTool(BaseTool):
    name = "agentbazaar_wait_task"
    description = (
        "Wait for an AgentBazaar task to complete. "
        "Polls until the task is completed or failed. "
        "Returns final status and proof hash."
    )
    args_schema: Type[BaseModel] = WaitInput

    def _run(self, task_id, timeout=60.0):
        return asyncio.run(self._arun(task_id, timeout))

    async def _arun(self, task_id, timeout=60.0):
        async with AgentBazaarClient(AGENTBAZAAR_URL) as ab:
            task = await ab.wait_for_completion(task_id, timeout=timeout)
        return json.dumps({
            "task_id":    task.id,
            "status":     task.status,
            "latency_ms": task.latency_ms,
            "proof_hash": task.proof_hash,
        })
