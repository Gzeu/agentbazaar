/**
 * AgentBazaar SDK — Discover Services via Registry
 * Consumer agents use this to find available services on devnet.
 */

import { DEVNET, loadDevnetConfig } from "./devnet";

export interface ServiceDescriptor {
  service_id:           string;
  name:                 string;
  category:             string;
  provider:             string;
  endpoint_url:         string;
  pricing_model:        string;
  price_per_unit:       string;
  max_latency_ms:       number;
  uptime_guarantee_bps: number;
  ucp_compatible:       boolean;
  mcp_compatible:       boolean;
  metadata_hash:        string;
  registered_at:        number;
  active:               boolean;
  total_tasks:          number;
}

export interface DiscoveryFilters {
  category?:         string;
  maxPricePerUnit?:  bigint;
  ucpCompatible?:    boolean;
  mcpCompatible?:    boolean;
  minUptimeBps?:     number;
  maxLatencyMs?:     number;
}

/**
 * Query the devnet Registry API for active services.
 * Uses MultiversX devnet API directly for off-chain reads.
 */
export async function discoverServices(
  filters?: DiscoveryFilters,
): Promise<ServiceDescriptor[]> {
  const config = loadDevnetConfig();
  const registryAddr = config.contracts.registry;

  if (!registryAddr) {
    throw new Error("Registry contract not deployed. Run ./devnet/deploy.sh first.");
  }

  // Query sc/query endpoint on devnet API
  const queryUrl = `${DEVNET.API}/vm-values/query`;
  const body = {
    scAddress: registryAddr,
    funcName:  "getServiceCount",
    args:      [],
  };

  const response = await fetch(queryUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  const data = await response.json() as any;
  const countHex = data?.data?.data?.returnData?.[0] ?? "00";
  const count = parseInt(countHex, 16);

  console.log(`🔍 Registry @ ${registryAddr}`);
  console.log(`   Total services registered: ${count}`);
  console.log(`   Explorer: ${DEVNET.EXPLORER}/accounts/${registryAddr}`);

  // Return empty array for now; full pagination query built per-service
  return [];
}

/**
 * Get a specific service by ID
 */
export async function getService(serviceId: string): Promise<ServiceDescriptor | null> {
  const config = loadDevnetConfig();
  const registryAddr = config.contracts.registry;

  const queryUrl = `${DEVNET.API}/vm-values/query`;
  const body = {
    scAddress: registryAddr,
    funcName:  "getService",
    args:      [Buffer.from(serviceId).toString("hex")],
  };

  const response = await fetch(queryUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  const data = await response.json() as any;
  const returnCode = data?.data?.data?.returnCode;

  if (returnCode !== "ok" || !data?.data?.data?.returnData?.[0]) {
    return null;
  }

  console.log(`✅ Service '${serviceId}' found in Registry`);
  return { service_id: serviceId } as ServiceDescriptor; // decode full struct from ABI
}
