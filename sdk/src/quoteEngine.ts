/**
 * quoteEngine.ts
 * Off-chain quote engine: generates deterministic quotes from service descriptors.
 * Provider agents call this to respond to quote requests before on-chain escrow creation.
 */

import crypto from "crypto";
import { QuoteRequest, QuoteResponse, ServiceDescriptor } from "./types";

const BASE_MARKUP_BPS = 100; // 1% platform fee built into quote

export function generateQuote(
  request: QuoteRequest,
  service: ServiceDescriptor,
): QuoteResponse {
  if (!service.serviceId) throw new Error("Service must have a serviceId to generate a quote");
  if (request.maxPrice && service.price) {
    if (BigInt(service.price) > BigInt(request.maxPrice)) {
      throw new Error(
        `Service price ${service.price} exceeds buyer maxPrice ${request.maxPrice}`,
      );
    }
  }

  const basePrice = BigInt(service.price ?? "0");
  const fee = (basePrice * BigInt(BASE_MARKUP_BPS)) / 10000n;
  const totalPrice = (basePrice + fee).toString();

  const expiresAt = Date.now() + 60_000; // 60s validity

  const quoteId = crypto
    .createHash("sha256")
    .update(`${service.serviceId}:${request.buyer}:${totalPrice}:${expiresAt}`)
    .digest("hex");

  const termsHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ serviceId: service.serviceId, price: totalPrice, buyer: request.buyer }))
    .digest("hex");

  return {
    quoteId,
    serviceId: service.serviceId,
    provider: service.provider,
    price: totalPrice,
    currency: service.currency ?? "EGLD",
    expiresAt,
    termsHash,
    settlementMethod: "escrow",
  };
}

export function isQuoteValid(quote: QuoteResponse): boolean {
  return Date.now() < quote.expiresAt;
}
