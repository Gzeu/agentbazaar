'use client';
import { useEffect, useRef, useState } from 'react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export interface AgentEvent {
  type: 'TaskCreated' | 'TaskCompleted' | 'ReputationUpdated' | 'ServiceRegistered' | string;
  hash?: string;
  taskId?: string;
  serviceId?: string;
  address?: string;
  timestamp: string;
}

export function useEvents(maxEvents = 20) {
  const [events, setEvents]     = useState<AgentEvent[]>([]);
  const [connected, setConn]    = useState(false);
  const socketRef = useRef<unknown>(null);

  useEffect(() => {
    let socket: { on: (e: string, cb: (d: unknown) => void) => void; disconnect: () => void; connected: boolean } | null = null;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        socket = io(`${BACKEND}/events`, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        }) as typeof socket;
        socketRef.current = socket;

        socket!.on('connect',    ()  => setConn(true));
        socket!.on('disconnect', ()  => setConn(false));
        socket!.on('event',      (d) => {
          setEvents(prev => {
            const ev = d as AgentEvent;
            return [{ ...ev, timestamp: ev.timestamp ?? new Date().toISOString() }, ...prev].slice(0, maxEvents);
          });
        });
      } catch {
        // socket.io-client not installed — graceful degradation
      }
    };

    connect();
    return () => {
      socket?.disconnect();
      setConn(false);
    };
  }, [maxEvents]);

  return { events, connected };
}
