from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum


class TaskStatus(str, Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    COMPLETED = "completed"
    FAILED    = "failed"
    DISPUTED  = "disputed"


@dataclass
class Service:
    id: str
    name: str
    category: str
    description: str
    provider_address: str
    endpoint: str
    pricing_model: str
    price_amount: str
    price_token: str = "EGLD"
    max_latency_ms: int = 500
    uptime_guarantee: float = 99.0
    reputation_score: float = 0.0
    total_tasks: int = 0
    ucp_compatible: bool = True
    mcp_compatible: bool = True
    tags: List[str] = field(default_factory=list)
    active: bool = True
    created_at: str = ""


@dataclass
class Task:
    id: str
    service_id: str
    consumer_id: str
    provider_address: str
    status: TaskStatus
    max_budget: str
    payload_hash: Optional[str] = None
    proof_hash: Optional[str] = None
    escrow_tx_hash: Optional[str] = None
    latency_ms: Optional[int] = None
    created_at: str = ""
    updated_at: str = ""
    deadline: str = ""


@dataclass
class ReputationEntry:
    agent_address: str
    composite_score: float
    completion_rate: float
    total_tasks: int
    successful_tasks: int
    avg_latency_ms: float
    slashed: bool = False


@dataclass
class DiscoveryQuery:
    category: Optional[str] = None
    max_latency_ms: Optional[int] = None
    min_score: Optional[float] = None
    ucp_required: bool = False
    mcp_required: bool = False
