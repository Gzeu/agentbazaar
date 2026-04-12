import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export type WsEventType =
  | 'TaskCreated'
  | 'TaskRunning'
  | 'TaskCompleted'
  | 'TaskFailed'
  | 'TaskDisputed'
  | 'ReputationUpdated'
  | 'ServiceRegistered'
  | 'ServiceDeactivated';

export interface WsEvent {
  type: WsEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/events' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);
  private clientCount = 0;

  handleConnection(client: Socket) {
    this.clientCount++;
    this.logger.log(`WS connected: ${client.id} (total: ${this.clientCount})`);
    client.emit('connected', {
      message: 'AgentBazaar event stream ready',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.clientCount--;
    this.logger.log(`WS disconnected: ${client.id} (total: ${this.clientCount})`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: { room: string }) {
    this.logger.debug(`Subscribe to room: ${data?.room}`);
  }

  /** Broadcast a real event to all connected WS clients */
  broadcast(type: WsEventType, payload: Record<string, unknown>) {
    const event: WsEvent = { type, payload, timestamp: new Date().toISOString() };
    this.server?.emit('event', event);
    this.logger.debug(`WS broadcast: ${type}`);
  }

  /** Convenience: emit to a single socket (e.g. on connect) */
  emit(event: string, payload: Record<string, unknown>) {
    this.server?.emit(event, { ...payload, timestamp: new Date().toISOString() });
  }
}
