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
import { WsEventType, WsEvent, ChainEvent } from './chain-event.types';

const MAX_RECENT = 100;

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/events' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);
  private clientCount = 0;
  private recentEvents: (WsEvent | ChainEvent)[] = [];

  handleConnection(client: Socket) {
    this.clientCount++;
    this.logger.log(`WS connected: ${client.id} (total: ${this.clientCount})`);
    client.emit('connected', {
      message: 'AgentBazaar event stream ready',
      timestamp: new Date().toISOString(),
    });
    // Replay last N events to new subscriber
    if (this.recentEvents.length > 0) {
      client.emit('replay', { events: this.recentEvents.slice(-20) });
    }
  }

  handleDisconnect(client: Socket) {
    this.clientCount--;
    this.logger.log(`WS disconnected: ${client.id} (total: ${this.clientCount})`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: { room: string }) {
    this.logger.debug(`Subscribe request: ${data?.room}`);
  }

  /** Broadcast a typed internal event (task/reputation lifecycle) */
  broadcast(type: WsEventType, payload: Record<string, unknown>) {
    const event: WsEvent = { type, payload, timestamp: new Date().toISOString() };
    this._push(event);
    this.server?.emit('event', event);
    this.logger.debug(`WS broadcast: ${type}`);
  }

  /** Forward a raw on-chain event from EventPoller */
  broadcastChainEvent(event: ChainEvent) {
    this._push(event);
    this.server?.emit('chain', event);
  }

  /** Returns the in-memory ring buffer of recent events */
  getRecentEvents(limit = 30): (WsEvent | ChainEvent)[] {
    return this.recentEvents.slice(-limit);
  }

  private _push(event: WsEvent | ChainEvent) {
    this.recentEvents.push(event);
    if (this.recentEvents.length > MAX_RECENT) {
      this.recentEvents.shift();
    }
  }

  /** Legacy compat */
  emit(event: string, payload: Record<string, unknown>) {
    this.server?.emit(event, { ...payload, timestamp: new Date().toISOString() });
  }
}

export { WsEventType, WsEvent, ChainEvent };
