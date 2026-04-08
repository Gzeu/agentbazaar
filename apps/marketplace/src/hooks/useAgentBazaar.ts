"use client";
/**
 * useAgentBazaar — SDK hook.
 *
 * When CONTRACT_ADDRESSES are configured (post-deploy), loads the real
 * AgentBazaar facade and queries the on-chain registry.
 * Falls back to MOCK_SERVICES until contracts are deployed.
 */
import { useState, useEffect } from "react";
import { CONTRACT_ADDRESSES, MVX_API_URL, MVX_ENVIRONMENT } from "@/lib/mvx/config";

export interface ServiceDescriptor {
  serviceId: string;
  name: string;
  category: string;
  description: string;
  price: string;
  priceRaw: number;
  provider: string;
  score: number;
  tags: string[];
  slaMs: number;
  active: boolean;
}

const MOCK_SERVICES: ServiceDescriptor[] = [
  { serviceId: "svc-001", name: "DataFetch Pro",          category: "data",           description: "Real-time market data for any token pair. Sub-300ms SLA.",         price: "0.0010 EGLD", priceRaw: 0.001,  provider: "erd1abc…", score: 97, tags: ["market","realtime","json"],  slaMs: 300,  active: true },
  { serviceId: "svc-002", name: "ML Compute Node",        category: "compute",        description: "Distributed GPU inference for LLM and embedding tasks.",           price: "0.0050 EGLD", priceRaw: 0.005,  provider: "erd1def…", score: 92, tags: ["gpu","llm","embeddings"],  slaMs: 800,  active: true },
  { serviceId: "svc-003", name: "Workflow Runner",         category: "orchestration",  description: "Multi-agent pipeline composition and execution engine.",           price: "0.0020 EGLD", priceRaw: 0.002,  provider: "erd1ghi…", score: 88, tags: ["pipeline","multi-agent"],   slaMs: 1200, active: true },
  { serviceId: "svc-004", name: "EGLD Price Oracle",       category: "data",           description: "Signed EGLD/USDC price feed updated every 30s on-chain.",         price: "0.0005 EGLD", priceRaw: 0.0005, provider: "erd1jkl…", score: 99, tags: ["oracle","price","signed"], slaMs: 100,  active: true },
  { serviceId: "svc-005", name: "AML Compliance Check",    category: "compliance",     description: "KYT/AML screening for wallet addresses and transaction paths.",   price: "0.0030 EGLD", priceRaw: 0.003,  provider: "erd1mno…", score: 95, tags: ["compliance","kyc","aml"],  slaMs: 500,  active: true },
  { serviceId: "svc-006", name: "Semantic Tagger",         category: "enrichment",     description: "Entity extraction, NLP tagging and semantic enrichment API.",     price: "0.0020 EGLD", priceRaw: 0.002,  provider: "erd1pqr…", score: 90, tags: ["nlp","embeddings"],       slaMs: 600,  active: true },
  { serviceId: "svc-007", name: "Wallet Action Bot",       category: "wallet-actions", description: "Automated staking, token swaps and bridging via signed mandate.", price: "0.0015 EGLD", priceRaw: 0.0015, provider: "erd1stu…", score: 85, tags: ["staking","swap","bridge"],  slaMs: 400,  active: true },
  { serviceId: "svc-008", name: "Push Notification Relay", category: "notifications",  description: "Webhook and push alert delivery with guaranteed sub-1s latency.", price: "0.0003 EGLD", priceRaw: 0.0003, provider: "erd1vwx…", score: 93, tags: ["webhook","push","alerts"],  slaMs: 200,  active: true },
];

export function useServices(category?: string, search?: string) {
  const [services, setServices] = useState<ServiceDescriptor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [onChain, setOnChain]   = useState(false);

  useEffect(() => {
    setLoading(true);

    const registryAddress = CONTRACT_ADDRESSES.registry;
    const canUseChain = !!registryAddress;

    if (canUseChain) {
      // On-chain path — dynamic import to keep SDK out of SSR bundle
      (async () => {
        try {
          const { AgentBazaar } = await import("@agentbazaar/sdk");
          const config = {
            network: {
              apiUrl: MVX_API_URL,
              chainId: MVX_ENVIRONMENT === "mainnet" ? "1" : "D",
            },
            contracts: CONTRACT_ADDRESSES,
          };
          const ab = new AgentBazaar(config as never);
          // Fetch all services then filter client-side
          const catalog = await (ab as never as { ucp: { getAllServices(): Promise<ServiceDescriptor[]> } }).ucp.getAllServices();
          let filtered: ServiceDescriptor[] = catalog;
          if (category && category !== "All")
            filtered = filtered.filter((s) => s.category === category);
          if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
              (s) =>
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.tags.some((t) => t.includes(q))
            );
          }
          setServices(filtered);
          setOnChain(true);
        } catch (err) {
          console.warn("[useServices] on-chain fetch failed, falling back to mock:", err);
          setServices(applyFilters(MOCK_SERVICES, category, search));
        } finally {
          setLoading(false);
        }
      })();
    } else {
      // Mock path — simulate network latency
      const t = setTimeout(() => {
        setServices(applyFilters(MOCK_SERVICES, category, search));
        setLoading(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [category, search]);

  return { services, loading, onChain };
}

function applyFilters(
  list: ServiceDescriptor[],
  category?: string,
  search?: string
): ServiceDescriptor[] {
  let out = list;
  if (category && category !== "All") out = out.filter((s) => s.category === category);
  if (search) {
    const q = search.toLowerCase();
    out = out.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q))
    );
  }
  return out;
}
