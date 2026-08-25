/** Shared chain event types — imported by both gateway and poller */

export type WsEventType =
  | 'TaskCreated'
  | 'TaskRunning'
  | 'TaskCompleted'
  | 'TaskFailed'
  | 'TaskDisputed'
  | 'ReputationUpdated'
  | 'ServiceRegistered'
  | 'ServiceDeactivated'
  | 'EscrowReleased'
  | 'TaskRefunded';

export interface ChainEvent {
  id: string;
  type: WsEventType | string;
  txHash?: string;
  timestamp: number;
  blockNonce: number;
  data: Record<string, unknown>;
}

export interface WsEvent {
  type: WsEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}
