"use client";
import { useState, useCallback, useEffect } from "react";
import { useBuyTask, BuyTaskStep } from "@/hooks/useBuyTask";
import { ServiceDescriptor } from "@/hooks/useAgentBazaar";
import { useWallet } from "@/context/WalletContext";

interface BuyTaskModalProps {
  service: ServiceDescriptor;
  onClose: () => void;
}

const STEP_LABELS: Record<BuyTaskStep, string> = {
  idle:         "Prepare",
  building:     "Building TX…",
  signing:      "Waiting for signature…",
  broadcasting: "Broadcasting…",
  confirming:   "Confirming on-chain…",
  done:         "Done!",
  error:        "Error",
};

const STEPS: BuyTaskStep[] = ["building", "signing", "broadcasting", "confirming", "done"];

export function BuyTaskModal({ service, onClose }: BuyTaskModalProps) {
  const { connected, openModal: openWallet, address } = useWallet();
  const { buyTask, step, error, result, reset } = useBuyTask();
  const [payload, setPayload] = useState(
    JSON.stringify({ query: "example input for " + service.name }, null, 2)
  );
  const [payloadError, setPayloadError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const validatePayload = useCallback(() => {
    try {
      JSON.parse(payload);
      setPayloadError(null);
      return true;
    } catch {
      setPayloadError("Invalid JSON payload");
      return false;
    }
  }, [payload]);

  const handleBuy = useCallback(async () => {
    if (!validatePayload()) return;
    await buyTask({
      serviceId:       service.serviceId,
      providerAddress: service.provider.replace("…", ""),
      priceRaw:        service.priceRaw,
      payload:         JSON.parse(payload) as Record<string, unknown>,
    });
  }, [buyTask, service, payload, validatePayload]);

  const isActive = step !== "idle" && step !== "error" && step !== "done";
  const currentStepIdx = STEPS.indexOf(step);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={!isActive ? onClose : undefined}
    >
      <div
        className="card w-full max-w-lg space-y-5"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-base" style={{ color: "var(--color-text)" }}>
              Buy Task
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {service.name} &middot; {service.price} per call
            </p>
          </div>
          {!isActive && (
            <button onClick={onClose} style={{ color: "var(--color-text-muted)" }} className="text-lg leading-none">
              ×
            </button>
          )}
        </div>

        {/* Service summary */}
        <div
          className="rounded-xl p-3 flex flex-col gap-2 text-xs"
          style={{ background: "var(--color-surface-2)" }}
        >
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Category</span>
            <span className="badge">{service.category}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>SLA</span>
            <span style={{ color: "var(--color-text)" }}>{service.slaMs}ms</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Score</span>
            <span style={{ color: "var(--color-success)" }}>⭐ {service.score}/100</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Escrow amount</span>
            <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
              {service.price}
            </span>
          </div>
        </div>

        {/* Payload editor */}
        {step === "idle" && (
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              Task payload (JSON)
            </label>
            <textarea
              className="input textarea"
              rows={6}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              onBlur={validatePayload}
              spellCheck={false}
              style={{ fontFamily: "monospace", fontSize: "0.78rem" }}
            />
            {payloadError && (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                ⚠ {payloadError}
              </p>
            )}
          </div>
        )}

        {/* Stepper */}
        {step !== "idle" && (
          <div className="space-y-3">
            {STEPS.map((s, i) => {
              const done    = currentStepIdx > i || step === "done";
              const active  = currentStepIdx === i && step !== "done" && step !== "error";
              const errored = step === "error" && currentStepIdx === i;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className="stepper-dot"
                    style={{
                      background: errored
                        ? "var(--color-danger)"
                        : done
                        ? "var(--color-success)"
                        : active
                        ? "var(--color-primary)"
                        : "var(--color-surface-2)",
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{
                      color: active
                        ? "var(--color-text)"
                        : done
                        ? "var(--color-success)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {s === step ? STEP_LABELS[s] : s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                  {active && (
                    <span
                      className="animate-pulse-dot ml-auto text-xs"
                      style={{ color: "var(--color-primary)" }}
                    >
                      ⏳
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {step === "error" && error && (
          <div
            className="rounded-lg p-3 text-xs"
            style={{ background: "rgba(255,77,79,0.08)", color: "var(--color-danger)" }}
          >
            {error}
          </div>
        )}

        {/* Done */}
        {step === "done" && result && (
          <div
            className="rounded-lg p-4 space-y-2 text-xs"
            style={{ background: "rgba(82,196,26,0.08)", color: "var(--color-success)" }}
          >
            <div className="font-semibold text-sm">✅ Task submitted successfully!</div>
            <div>
              Task ID:{" "}
              <span className="font-mono" style={{ color: "var(--color-text)" }}>
                {result.taskId}
              </span>
            </div>
            {result.txHash !== "off-chain" && (
              <div>
                TX:{" "}
                <a
                  href={
                    `https://devnet-explorer.multiversx.com/transactions/${result.txHash}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  {result.txHash.slice(0, 16)}…
                </a>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {step === "idle" && (
            <>
              {!connected ? (
                <button onClick={openWallet} className="btn-primary flex-1">
                  Connect Wallet to Buy
                </button>
              ) : (
                <button onClick={handleBuy} className="btn-primary flex-1">
                  Confirm &amp; Sign ({service.price})
                </button>
              )}
              <button onClick={onClose} className="btn-ghost">
                Cancel
              </button>
            </>
          )}
          {step === "done" && (
            <>
              <button onClick={onClose} className="btn-primary flex-1">
                Close
              </button>
              <a
                href="/consumer"
                className="btn-ghost flex-1 text-center"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                View in Dashboard →
              </a>
            </>
          )}
          {step === "error" && (
            <>
              <button onClick={reset} className="btn-primary flex-1">
                Try Again
              </button>
              <button onClick={onClose} className="btn-ghost">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
