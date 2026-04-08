"""
AgentBazaar async REST client
Requires: pip install httpx
"""
import asyncio
from typing import List, Optional
from dataclasses import asdict

try:
    import httpx
except ImportError:
    raise ImportError("Run: pip install httpx")

from .models import Service, Task, ReputationEntry, DiscoveryQuery, TaskStatus


class AgentBazaarClient:
    """
    Async client for the AgentBazaar backend API.

    Usage:
        async with AgentBazaarClient("http://localhost:3001") as ab:
            services = await ab.list_services(category="data")
            task = await ab.create_task(service_id=..., consumer_id=..., provider=..., budget="0.001")
    """

    def __init__(self, base_url: str = "http://localhost:3001", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self._headers = {"Content-Type": "application/json"}
        if api_key:
            self._headers["Authorization"] = f"Bearer {api_key}"
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        self._client = httpx.AsyncClient(base_url=self.base_url, headers=self._headers, timeout=10)
        return self

    async def __aexit__(self, *args):
        if self._client:
            await self._client.aclose()

    def _c(self) -> httpx.AsyncClient:
        if not self._client:
            raise RuntimeError("Use 'async with AgentBazaarClient(...) as ab:'")
        return self._client

    # ---------------------------------------------------------------- Services
    async def list_services(self, category: Optional[str] = None, limit: int = 50) -> List[Service]:
        params = {"limit": limit}
        if category:
            params["category"] = category
        r = await self._c().get("/services", params=params)
        r.raise_for_status()
        return [Service(**{k.replace("-", "_"): v for k, v in s.items()} ) for s in r.json()["data"]]

    async def get_service(self, service_id: str) -> Service:
        r = await self._c().get(f"/services/{service_id}")
        r.raise_for_status()
        return Service(**r.json())

    async def register_service(self, service: Service) -> Service:
        r = await self._c().post("/services", json=asdict(service))
        r.raise_for_status()
        return Service(**r.json())

    # ------------------------------------------------------------------ Tasks
    async def list_tasks(self, status: Optional[TaskStatus] = None, limit: int = 50) -> List[Task]:
        params = {"limit": limit}
        if status:
            params["status"] = status.value
        r = await self._c().get("/tasks", params=params)
        r.raise_for_status()
        return [Task(**t) for t in r.json()["data"]]

    async def get_task(self, task_id: str) -> Task:
        r = await self._c().get(f"/tasks/{task_id}")
        r.raise_for_status()
        return Task(**r.json())

    async def create_task(
        self,
        service_id: str,
        consumer_id: str,
        provider_address: str,
        budget_egld: str = "0.001",
        escrow_tx_hash: Optional[str] = None,
    ) -> Task:
        import uuid
        task_id = f"task-{str(uuid.uuid4())[:8]}"
        payload = {
            "id":              task_id,
            "serviceId":       service_id,
            "consumerId":      consumer_id,
            "providerAddress": provider_address,
            "maxBudget":       str(int(float(budget_egld) * 10**18)),
            "escrowTxHash":    escrow_tx_hash,
        }
        r = await self._c().post("/tasks", json=payload)
        r.raise_for_status()
        return Task(**r.json())

    async def complete_task(self, task_id: str, proof_hash: str, latency_ms: int) -> Task:
        r = await self._c().post(f"/tasks/{task_id}/complete",
                                  json={"proofHash": proof_hash, "latencyMs": latency_ms})
        r.raise_for_status()
        return Task(**r.json())

    async def wait_for_completion(
        self, task_id: str, poll_interval: float = 1.0, timeout: float = 60.0
    ) -> Task:
        """Poll until task is completed or failed."""
        deadline = asyncio.get_event_loop().time() + timeout
        while True:
            task = await self.get_task(task_id)
            if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.DISPUTED):
                return task
            if asyncio.get_event_loop().time() > deadline:
                raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")
            await asyncio.sleep(poll_interval)

    # ------------------------------------------------------------ Reputation
    async def get_leaderboard(self, limit: int = 20) -> List[ReputationEntry]:
        r = await self._c().get("/reputation/leaderboard", params={"limit": limit})
        r.raise_for_status()
        return [ReputationEntry(**e) for e in r.json()]

    async def get_reputation(self, address: str) -> ReputationEntry:
        r = await self._c().get(f"/reputation/{address}")
        r.raise_for_status()
        return ReputationEntry(**r.json())

    # ------------------------------------------------------------- Discovery
    async def discover(self, query: Optional[DiscoveryQuery] = None) -> List[Service]:
        q = query or DiscoveryQuery()
        params = {}
        if q.category:      params["category"]   = q.category
        if q.max_latency_ms: params["maxLatency"] = q.max_latency_ms
        if q.min_score:     params["minScore"]    = q.min_score
        if q.ucp_required:  params["ucp"]         = "true"
        if q.mcp_required:  params["mcp"]         = "true"
        r = await self._c().get("/discovery", params=params)
        r.raise_for_status()
        return [Service(**s) for s in r.json()["results"]]

    # ---------------------------------------------------------------- Health
    async def health(self) -> dict:
        r = await self._c().get("/health")
        r.raise_for_status()
        return r.json()
