import {
  Injectable, CanActivate, ExecutionContext,
  UnauthorizedException, SetMetadata,
} from '@nestjs/common';
import { Reflector }   from '@nestjs/core';
import { AuthService } from './auth.service';
import { Request }     from 'express';

export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly auth:      AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]
    );
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');

    try {
      (req as any).user = this.auth.verify(auth.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
