import {
  Injectable, CanActivate, ExecutionContext,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

const WINDOW_MS  = 1000;  // 1 second window
const MAX_RPS    = 10;    // requests per window per IP

@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly store = new Map<string, { count: number; resetAt: number }>();

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const ip  = (req.headers['x-forwarded-for'] as string ?? req.socket.remoteAddress ?? 'unknown')
                  .split(',')[0].trim();

    const now   = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    entry.count++;
    if (entry.count > MAX_RPS) {
      throw new HttpException(
        { message: 'Rate limit exceeded — max 10 req/s per IP', retryAfter: entry.resetAt - now },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  // Cleanup stale entries every 60s
  private cleanup() {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now > v.resetAt + 5000) this.store.delete(k);
    }
  }

  onModuleInit() {
    setInterval(() => this.cleanup(), 60_000);
  }
}
