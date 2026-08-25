export interface ChainEvent {
  id: string;
  type: string;
  txHash: string;
  timestamp: number;
  blockNonce: number;
  data: Record<string, unknown>;
}
