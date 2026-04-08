"use client";
import { useState, useEffect, useRef } from "react";

export type EventType = "TaskCreated" | "TaskCompleted" | "ServiceRegistered" | "ReputationUpdated" | "TaskDisputed" | "EscrowReleased";

export interface ChainEvent {
  id: string;
  type: EventType;
  txHash: string;
  timestamp: number;
  data: Record<string, string>;
}

const EVENT_COLORS: Record<EventType, string> = {
  TaskCreated:       "var(--color-primary)",
  TaskCompleted:     "var(--color-success)",
  ServiceRegistered: "#a78bfa",
  ReputationUpdated: "var(--color-warning)",
  TaskDisputed:      "var(--color-danger)",
  EscrowReleased:    "var(--color-success)",
};

const EVENT_ICONS: Record<EventType, string> = {
  TaskCreated:       "🆕",
  TaskCompleted:     "✅",
  ServiceRegistered: "📡",
  ReputationUpdated: "⭐",
  TaskDisputed:      "⚠️",
  EscrowReleased:    "💸",
};

export { EVENT_COLORS, EVENT_ICONS };

function randomHex(len = 16) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function randomAddr() {
  return `erd1${randomHex(30)}`;
}

const EVENT_TYPES: EventType[] = ["TaskCreated", "TaskCompleted", "ServiceRegistered", "ReputationUpdated", "EscrowReleased"];

function generateMockEvent(): ChainEvent {
  const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const base = {
    id: randomHex(8),
    type,
    txHash: randomHex(32),
    timestamp: Date.now(),
  };
  const dataMap: Record<EventType, Record<string, string>> = {
    TaskCreated:       { taskId: randomHex(6), provider: randomAddr(), amount: `${(Math.random() * 0.01).toFixed(4)} EGLD` },
    TaskCompleted:     { taskId: randomHex(6), latency: `${Math.floor(Math.random() * 400 + 80)}ms`, proof: randomHex(16) },
    ServiceRegistered: { serviceId: `svc-${randomHex(4)}`, category: ["data","compute","wallet-actions"][Math.floor(Math.random()*3)] },
    ReputationUpdated: { provider: randomAddr(), score: `${Math.floor(Math.random() * 20 + 80)}`, delta: `+${(Math.random() * 2).toFixed(1)}` },
    TaskDisputed:      { taskId: randomHex(6), reason: "timeout" },
    EscrowReleased:    { taskId: randomHex(6), amount: `${(Math.random() * 0.02).toFixed(4)} EGLD` },
  };
  return { ...base, data: dataMap[type] };
}

export function useEvents(maxEvents = 50, intervalMs = 2200) {
  const [events, setEvents] = useState<ChainEvent[]>(() =>
    Array.from({ length: 6 }, generateMockEvent)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setEvents((prev) => [generateMockEvent(), ...prev.slice(0, maxEvents - 1)]);
    }, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxEvents, intervalMs]);

  return events;
}
