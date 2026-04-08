import crypto from "crypto";
import { ACPCheckoutSession } from "./types";

export interface CreateACPCheckoutInput {
  buyer: string;
  provider: string;
  amount: string;
  currency: string;
  redirectUrl?: string;
  returnUrl?: string;
  metadata?: Record<string, string>;
}

export function createACPCheckoutSession(input: CreateACPCheckoutInput): ACPCheckoutSession {
  const sessionId = crypto
    .createHash("sha256")
    .update(`${input.buyer}:${input.provider}:${input.amount}:${Date.now()}`)
    .digest("hex");

  return {
    sessionId,
    buyer: input.buyer,
    provider: input.provider,
    amount: input.amount,
    currency: input.currency,
    redirectUrl: input.redirectUrl,
    returnUrl: input.returnUrl,
    status: "pending",
    metadata: input.metadata,
  };
}

export function authorizeACPCheckout(session: ACPCheckoutSession): ACPCheckoutSession {
  return { ...session, status: "authorized" };
}

export function captureACPCheckout(session: ACPCheckoutSession): ACPCheckoutSession {
  return { ...session, status: "captured" };
}

export function cancelACPCheckout(session: ACPCheckoutSession): ACPCheckoutSession {
  return { ...session, status: "cancelled" };
}
