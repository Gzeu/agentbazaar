"use client";
/**
 * useEvents — live event hook.
 *
 * When CONTRACT_ADDRESSES are set, subscribes to the real AgentBazaar
 * EventListener (500ms polling). Falls back to mock event generation.
 */
import { useState, useEffect, useRef } from "react";
import { CONTRACT_ADDRESSES, MVX_API_URL, MVX_ENVIRONMENT } from "@/lib/mvx/config";

export type EventType =
  | "TaskCreated"
  | "TaskCompleted"
  | "ServiceRegistered"
  | "ReputationUpdated"
  | "TaskDisputed"
  | "EscrowReleased";

export interface ChainEvent {
  id: string;
  type: EventType;
  txHash: string;
  timestamp: number;
  data: Record<string, string>;
}

export const EVENT_COLORS: Record<EventType, string> = {
  TaskCreated:       "var(--color-primary)",
  TaskCompleted:     "var(--color-success)",
  ServiceRegistered: "#a78bfa",
  ReputationUpdated: "var(--color-warning)",
  TaskDisputed:      "var(--color-danger)",
  EscrowReleased:    "var(--color-success)",
};

export const EVENT_ICONS: Record<EventType, string> = {
  TaskCreated:       "🆕",
  TaskCompleted:     "✅",
  ServiceRegistered: "📡",
  ReputationUpdated: "⭐",
  TaskDisputed:      "⚠️",
  EscrowReleased:    "💸",
};

// ── Mock helpers ─────────────────────────────────────────────────────────────
function rnd(len = 16) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

const MOCK_EVENT_TYPES: EventType[] = [
  "TaskCreated",
  "TaskCompleted",
  "ServiceRegistered",
  "ReputationUpdated",
  "EscrowReleased",
];

function mockEvent(): ChainEvent {
  const type =
    MOCK_EVENT_TYPES[Math.floor(Math.random() * MOCK_EVENT_TYPES.length)];
  const dataMap: Record<EventType, Record<string, string>> = {
    TaskCreated:       { taskId: rnd(6), provider: `erd1${rnd(30)}`, amount: `${(Math.random() * 0.01).toFixed(4)} EGLD` },
    TaskCompleted:     { taskId: rnd(6), latency: `${Math.floor(Math.random() * 400 + 80)}ms`, proof: rnd(16) },
    ServiceRegistered: { serviceId: `svc-${rnd(4)}`, category: ["data","compute","wallet-actions"][Math.floor(Math.random()*3)] },
    ReputationUpdated: { provider: `erd1${rnd(20)}`, score: `${Math.floor(Math.random()*20+80)}`, delta: `+${(Math.random()*2).toFixed(1)}` },
    TaskDisputed:      { taskId: rnd(6), reason: "timeout" },
    EscrowReleased:    { taskId: rnd(6), amount: `${(Math.random()*0.02).toFixed(4)} EGLD` },
  };
  return { id: rnd(8), type, txHash: rnd(32), timestamp: Date.now(), data: dataMap[type] };
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useEvents(maxEvents = 80, mockIntervalMs = 2200) {
  const [events, setEvents] = useState<ChainEvent[]>(() =>
    Array.from({ length: 8 }, mockEvent)
  );
  const abRef = useRef<{
    events: { on(e: string, cb: (x: ChainEvent) => void): void; start(ms: number): void; stop(): void };
  } | null>(null);

  useEffect(() => {
    const canUseChain =
      !!CONTRACT_ADDRESSES.escrow &&
      !!CONTRACT_ADDRESSES.registry &&
      !!CONTRACT_ADDRESSES.reputation;

    if (canUseChain) {
      // Real EventListener path
      (async () => {
        try {
          const { AgentBazaar } = await import("@agentbazaar/sdk");
          const config = {
            network: { apiUrl: MVX_API_URL, chainId: MVX_ENVIRONMENT === "mainnet" ? "1" : "D" },
            contracts: CONTRACT_ADDRESSES,
          };
          const ab = new AgentBazaar(config as never);
          abRef.current = ab as never;

          const pushEvent = (e: ChainEvent) =>
            setEvents((prev) => [e, ...prev.slice(0, maxEvents - 1)]);

          const eventTypes: EventType[] = [
            "TaskCreated",
            "TaskCompleted",
            "ServiceRegistered",
            "ReputationUpdated",
            "EscrowReleased",
          ];
          eventTypes.forEach((t) => ab.events.on(t, (raw) => pushEvent(raw as ChainEvent)));
          ab.events.start(500);
        } catch (err) {
          console.warn("[useEvents] on-chain events failed, using mock:", err);
        }
      })();

      return () => {
        try { abRef.current?.events.stop(); } catch { /* noop */ }
      };
    } else {
      // Mock path
      const timer = setInterval(() => {
        setEvents((prev) => [mockEvent(), ...prev.slice(0, maxEvents - 1)]);
      }, mockIntervalMs);
      return () => clearInterval(timer);
    }
  }, [maxEvents, mockIntervalMs]);

  return events;
}
