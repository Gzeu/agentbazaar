"use client";

import { useState } from "react";
import { servicesApi, type RegisterServicePayload } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

const CATEGORIES = [
  "data", "compute", "wallet-actions", "compliance",
  "enrichment", "orchestration", "notifications",
];
const PRICING_MODELS = ["per-call", "subscription", "pay-as-you-go"];

type SubmitState = "idle" | "loading" | "success" | "error";

export default function RegisterPage() {
  const { connected, address } = useWallet();
  const [form, setForm] = useState({
    name: "",
    category: CATEGORIES[0],
    description: "",
    endpoint: "",
    pricingModel: PRICING_MODELS[0],
    priceAmount: "0.0001",
    maxLatencyMs: "500",
    tags: "",
  });
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!connected || !address) {
      setError("Connect your wallet first.");
      return;
    }
    const payload: RegisterServicePayload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
      providerAddress: address,
      endpoint: form.endpoint.trim(),
      pricingModel: form.pricingModel,
      priceAmount: form.priceAmount,
      maxLatencyMs: form.maxLatencyMs ? Number(form.maxLatencyMs) : undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    setState("loading");
    setError(null);
    try {
      const res = await servicesApi.register(payload);
      setServiceId(res.id);
      setState("success");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  };

  const inputCls = "input mt-1";
  const labelCls = "text-xs font-medium";
  const labelStyle = { color: "var(--color-text-muted)" };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Register a Service</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            List your agent service on the AgentBazaar marketplace. Consumers discover it via UCP and pay per call via escrow.
          </p>
        </div>

        {state === "success" && serviceId ? (
          <div className="card space-y-3 text-center">
            <div className="text-4xl">🎉</div>
            <h2 className="font-bold" style={{ color: "var(--color-text)" }}>Service Registered</h2>
            <p className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>id: {serviceId}</p>
            <button className="btn-primary" onClick={() => { setState("idle"); setServiceId(null); }}>
              Register another
            </button>
          </div>
        ) : (
          <div className="card space-y-5">
            {/* Name */}
            <div>
              <label className={labelCls} style={labelStyle}>Service name *</label>
              <input className={inputCls} placeholder="e.g. EGLD Price Oracle" value={form.name} onChange={set("name")} />
            </div>

            {/* Category */}
            <div>
              <label className={labelCls} style={labelStyle}>Category *</label>
              <select className={inputCls} value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls} style={labelStyle}>Description</label>
              <textarea className={`${inputCls} min-h-[80px] resize-none`} placeholder="What does your agent service do?" value={form.description} onChange={set("description")} />
            </div>

            {/* Endpoint */}
            <div>
              <label className={labelCls} style={labelStyle}>MCP endpoint URL *</label>
              <input className={`${inputCls} font-mono text-xs`} placeholder="https://my-agent.example.com/mcp" value={form.endpoint} onChange={set("endpoint")} />
            </div>

            {/* Pricing row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Pricing model</label>
                <select className={inputCls} value={form.pricingModel} onChange={set("pricingModel")}>
                  {PRICING_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Price (EGLD) *</label>
                <input className={inputCls} type="number" min={0} step="0.0001" value={form.priceAmount} onChange={set("priceAmount")} />
              </div>
            </div>

            {/* Latency + tags row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Max latency (ms)</label>
                <input className={inputCls} type="number" min={0} value={form.maxLatencyMs} onChange={set("maxLatencyMs")} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Tags (comma-separated)</label>
                <input className={inputCls} placeholder="oracle, defi, real-time" value={form.tags} onChange={set("tags")} />
              </div>
            </div>

            {error && (
              <p className="text-xs rounded px-3 py-2" style={{ color: "var(--color-danger)", background: "rgba(220,38,38,.12)" }}>
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full disabled:opacity-50"
              disabled={state === "loading" || !form.name.trim() || !form.endpoint.trim()}
              onClick={handleSubmit}
            >
              {state === "loading" ? "Registering…" : connected ? "Register Service" : "Connect Wallet to Register"}
            </button>
            {!connected && (
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                Your wallet address will be used as the provider payout address.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
