"""
MultiversX transaction helpers for AgentBazaar Python SDK
Requires: pip install multiversx-sdk
"""
from typing import Optional


def build_create_task_tx(
    task_id: str,
    service_id: str,
    provider: str,
    budget_egld: float,
    escrow_contract: str,
    chain_id: str = "D",
) -> dict:
    """
    Build a createTask transaction dict compatible with multiversx-sdk.
    Returns a dict ready to be passed to ProxyNetworkProvider.send_transaction.
    """
    payload_parts = [
        "createTask",
        task_id.encode().hex(),
        service_id.encode().hex(),
        provider,
        b"".hex(),  # payload_hash placeholder
    ]
    data = "@".join(payload_parts)
    return {
        "receiver":  escrow_contract,
        "value":     str(int(budget_egld * 10**18)),
        "data":      data,
        "gas_limit": 10_000_000,
        "chain_id":  chain_id,
    }


def build_register_service_tx(
    service_id: str,
    name: str,
    category: str,
    endpoint_url: str,
    pricing_model: str,
    price_wei: int,
    metadata_uri: str,
    stake_egld: float,
    registry_contract: str,
    chain_id: str = "D",
) -> dict:
    payload_parts = [
        "registerService",
        service_id.encode().hex(),
        name.encode().hex(),
        category.encode().hex(),
        endpoint_url.encode().hex(),
        pricing_model.encode().hex(),
        format(price_wei, 'x').zfill(2),
        metadata_uri.encode().hex(),
    ]
    data = "@".join(payload_parts)
    return {
        "receiver":  registry_contract,
        "value":     str(int(stake_egld * 10**18)),
        "data":      data,
        "gas_limit": 15_000_000,
        "chain_id":  chain_id,
    }


def format_egld(wei: int, decimals: int = 4) -> str:
    return f"{wei / 10**18:.{decimals}f}"


def short_addr(addr: str, chars: int = 6) -> str:
    return f"{addr[:chars+4]}...{addr[-4:]}" if addr else ""
