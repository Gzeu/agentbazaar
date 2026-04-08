import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';

export interface ChainEvent {
  id: string;
  type: string;
  txHash: string;
  timestamp: number;
  blockNonce: number;
  data: Record<string, string>;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);
  private readonly recentEvents: ChainEvent[] = [];
  private readonly MAX_HISTORY = 100;

  afterInit() {
    this.logger.log('WebSocket /events gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    // Send last N events on connect
    client.emit('history', this.recentEvents.slice(0, 30));
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() types: string[],
    @ConnectedSocket() client: Socket,
  ) {
    if (Array.isArray(types)) {
      types.forEach((t) => client.join(`event:${t}`));
    } else {
      client.join('event:all');
    }
    return { status: 'subscribed', types };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() types: string[],
    @ConnectedSocket() client: Socket,
  ) {
    if (Array.isArray(types)) {
      types.forEach((t) => client.leave(`event:${t}`));
    }
    return { status: 'unsubscribed' };
  }

  // Called by EventPoller via NestJS EventEmitter
  @OnEvent('chain.event')
  broadcast(event: ChainEvent) {
    // Add to rolling buffer
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.MAX_HISTORY) {
      this.recentEvents.pop();
    }

    // Broadcast to all subscribers
    this.server?.emit('event', event);
    this.server?.to(`event:${event.type}`).emit('event', event);
    this.server?.to('event:all').emit('event', event);
  }

  getRecentEvents(limit = 30): ChainEvent[] {
    return this.recentEvents.slice(0, limit);
  }
}
