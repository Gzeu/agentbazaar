import crypto from "crypto";
import { X402PaymentReceipt, X402PaymentRequest } from "./types";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
    .join(",")}}`;
}

export function canonicalizePaymentRequest(request: X402PaymentRequest): string {
  return stableStringify(request);
}

export function signX402Payment(request: X402PaymentRequest, secret: string): X402PaymentReceipt {
  const createdAt = Date.now();
  const paymentId = crypto
    .createHash("sha256")
    .update(`${request.payer}:${request.payee}:${request.resource}:${createdAt}`)
    .digest("hex");

  const payload = canonicalizePaymentRequest({ ...request, nonce: request.nonce ?? paymentId });
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return {
    paymentId,
    resource: request.resource,
    amount: request.amount,
    currency: request.currency,
    payer: request.payer,
    payee: request.payee,
    status: "authorized",
    signature,
    createdAt,
  };
}

export function verifyX402Receipt(
  request: X402PaymentRequest,
  receipt: X402PaymentReceipt,
  secret: string,
): boolean {
  const payload = canonicalizePaymentRequest({ ...request, nonce: request.nonce ?? receipt.paymentId });
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === receipt.signature;
}

export async function captureX402Payment(
  receipt: X402PaymentReceipt,
): Promise<X402PaymentReceipt> {
  return {
    ...receipt,
    status: "captured",
  };
}
