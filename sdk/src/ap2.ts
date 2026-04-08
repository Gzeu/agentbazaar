import { AP2Mandate, MandateValidationResult, QuoteResponse, TaskRequest } from "./types";

export interface MandateValidationInput {
  mandate: AP2Mandate;
  quote?: QuoteResponse;
  task?: TaskRequest;
  category?: string;
  serviceId?: string;
  now?: number;
  spentToday?: string;
}

function toBigIntAmount(value?: string): bigint {
  return BigInt(value ?? "0");
}

export function validateMandate(input: MandateValidationInput): MandateValidationResult {
  const now = input.now ?? Date.now();
  const { mandate } = input;

  if (mandate.revoked) {
    return { valid: false, reason: "Mandate revoked" };
  }

  if (now < mandate.validFrom) {
    return { valid: false, reason: "Mandate not active yet" };
  }

  if (now > mandate.validUntil) {
    return { valid: false, reason: "Mandate expired" };
  }

  const serviceId = input.serviceId ?? input.quote?.serviceId ?? input.task?.serviceId;
  if (mandate.allowedServices?.length && serviceId && !mandate.allowedServices.includes(serviceId)) {
    return { valid: false, reason: "Service not allowed by mandate" };
  }

  const category = input.category;
  if (mandate.allowedCategories?.length && category && !mandate.allowedCategories.includes(category)) {
    return { valid: false, reason: "Category not allowed by mandate" };
  }

  const amount = toBigIntAmount(input.quote?.price ?? input.task?.amount);
  const maxAmount = toBigIntAmount(mandate.maxAmount);
  if (amount > maxAmount) {
    return { valid: false, reason: "Amount exceeds mandate maxAmount" };
  }

  const spentToday = toBigIntAmount(input.spentToday);
  const dailyLimit = toBigIntAmount(mandate.dailyLimit);
  if (dailyLimit > 0n && spentToday + amount > dailyLimit) {
    return { valid: false, reason: "Amount exceeds daily limit" };
  }

  const remainingAllowance = (dailyLimit > 0n ? dailyLimit - (spentToday + amount) : maxAmount - amount).toString();
  return { valid: true, remainingAllowance };
}

export function revokeMandate(mandate: AP2Mandate): AP2Mandate {
  return { ...mandate, revoked: true };
}
