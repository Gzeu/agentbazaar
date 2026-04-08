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

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/events' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);
  private clientCount = 0;

  handleConnection(client: Socket) {
    this.clientCount++;
    this.logger.log(`WS connected: ${client.id} (total: ${this.clientCount})`);
    // Send welcome event
    client.emit('connected', {
      message: 'AgentBazaar event stream ready',
      timestamp: new Date().toISOString(),
    });
    // Start mock event stream for demo
    this.startMockStream(client);
  }

  handleDisconnect(client: Socket) {
    this.clientCount--;
    this.logger.log(`WS disconnected: ${client.id} (total: ${this.clientCount})`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: { room: string }) {
    this.logger.debug(`Subscribe to room: ${data?.room}`);
  }

  emit(event: string, payload: Record<string, unknown>) {
    this.server?.emit(event, { ...payload, timestamp: new Date().toISOString() });
  }

  private startMockStream(client: Socket) {
    const events = [
      { type: 'TaskCreated',       delay: 3000  },
      { type: 'TaskCompleted',     delay: 6000  },
      { type: 'ReputationUpdated', delay: 9000  },
      { type: 'ServiceRegistered', delay: 12000 },
    ];
    for (const ev of events) {
      const t = setTimeout(() => {
        if (!client.connected) return;
        client.emit('event', {
          type: ev.type,
          hash: '0x' + Math.random().toString(16).slice(2, 18),
          timestamp: new Date().toISOString(),
        });
      }, ev.delay);
      client.on('disconnect', () => clearTimeout(t));
    }
  }
}
