"use client";
import { useState, useEffect } from "react";
import { ServiceDescriptor } from "@/hooks/useAgentBazaar";
import { CONTRACT_ADDRESSES, MVX_API_URL, MVX_ENVIRONMENT } from "@/lib/mvx/config";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export function useServiceDetail(serviceId: string | null) {
  const [service, setService] = useState<ServiceDescriptor | null>(null);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1. Try NestJS backend
        const res = await fetch(`${BACKEND_URL}/services/${serviceId}`);
        if (res.ok) {
          const data = await res.json();
          setService(normaliseBackend(data));
          return;
        }
      } catch { /* fallthrough */ }

      try {
        // 2. Try on-chain SDK
        if (CONTRACT_ADDRESSES.registry) {
          const { AgentBazaar } = await import("@agentbazaar/sdk");
          const ab = new AgentBazaar({
            network: { apiUrl: MVX_API_URL, chainId: MVX_ENVIRONMENT === "mainnet" ? "1" : "D" },
            contracts: CONTRACT_ADDRESSES,
          } as never);
          const svc = await (ab as never as { registry: { getService(id: string): Promise<ServiceDescriptor> } }).registry.getService(serviceId);
          setService(svc);
          return;
        }
      } catch { /* fallthrough */ }

      // 3. Fallback — mock
      const MOCK: Record<string, ServiceDescriptor> = {
        "svc-001": { serviceId: "svc-001", name: "DataFetch Pro", category: "data", description: "Real-time market data for any token pair. Sub-300ms SLA guaranteed by on-chain stake.", price: "0.0010 EGLD", priceRaw: 0.001, provider: "erd1abc…", score: 97, tags: ["market","realtime","json"], slaMs: 300, active: true },
        "svc-002": { serviceId: "svc-002", name: "ML Compute Node", category: "compute", description: "Distributed GPU inference for LLM and embedding tasks. Auto-scale with proof of work.", price: "0.0050 EGLD", priceRaw: 0.005, provider: "erd1def…", score: 92, tags: ["gpu","llm","embeddings"], slaMs: 800, active: true },
        "svc-003": { serviceId: "svc-003", name: "Workflow Runner", category: "orchestration", description: "Multi-agent pipeline composition and execution engine. Chain up to 8 agents.", price: "0.0020 EGLD", priceRaw: 0.002, provider: "erd1ghi…", score: 88, tags: ["pipeline","multi-agent"], slaMs: 1200, active: true },
        "svc-004": { serviceId: "svc-004", name: "EGLD Price Oracle", category: "data", description: "Signed EGLD/USDC price feed updated every 30s on-chain with verifiable proof.", price: "0.0005 EGLD", priceRaw: 0.0005, provider: "erd1jkl…", score: 99, tags: ["oracle","price","signed"], slaMs: 100, active: true },
      };
      const found = MOCK[serviceId];
      if (found) setService(found);
      else setError("Service not found");
    })().finally(() => setLoading(false));
  }, [serviceId]);

  return { service, loading, error };
}

function normaliseBackend(d: Record<string, unknown>): ServiceDescriptor {
  return {
    serviceId:   String(d.id ?? d.serviceId ?? ""),
    name:        String(d.name ?? ""),
    category:    String(d.category ?? ""),
    description: String(d.description ?? ""),
    price:       `${Number(d.priceAmount ?? 0) / 1e18} EGLD`,
    priceRaw:    Number(d.priceAmount ?? 0) / 1e18,
    provider:    String(d.providerAddress ?? ""),
    score:       Number(d.reputationScore ?? 50),
    tags:        Array.isArray(d.tags) ? (d.tags as string[]) : [],
    slaMs:       Number(d.maxLatencyMs ?? 1000),
    active:      Boolean(d.active ?? true),
  };
}
