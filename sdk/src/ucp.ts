import { DiscoveryFilters, ServiceDescriptor, UCPServiceRecord } from "./types";

export function toUCPRecord(service: ServiceDescriptor): UCPServiceRecord {
  return {
    id: service.serviceId ?? `${service.provider}:${service.name}`,
    title: service.name,
    summary: service.description,
    provider: service.provider,
    endpoint: service.endpoint,
    category: service.category,
    tags: service.tags,
    price: service.price,
    currency: service.currency,
    reputationScore: service.reputationScore,
  };
}

export function filterUCPServices(
  services: ServiceDescriptor[],
  filters: DiscoveryFilters = {},
): UCPServiceRecord[] {
  const search = filters.search?.toLowerCase();

  return services
    .filter((service) => (filters.activeOnly ? service.active !== false : true))
    .filter((service) => (filters.category ? service.category === filters.category : true))
    .filter((service) => (filters.pricingModel ? service.pricingModel === filters.pricingModel : true))
    .filter((service) => (filters.provider ? service.provider === filters.provider : true))
    .filter((service) =>
      filters.minReputation !== undefined
        ? (service.reputationScore ?? 0) >= filters.minReputation
        : true,
    )
    .filter((service) =>
      filters.tags?.length
        ? filters.tags.every((tag) => service.tags?.includes(tag))
        : true,
    )
    .filter((service) =>
      search
        ? [service.name, service.description, service.category, ...(service.tags ?? [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search)
        : true,
    )
    .map(toUCPRecord);
}
