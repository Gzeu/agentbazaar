import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub:     string; // erd1 address
  address: string;
  role:    'consumer' | 'provider' | 'admin';
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  /**
   * Issue a JWT for a verified MultiversX address.
   * In production: verify a signed message from the wallet before issuing.
   */
  issue(address: string, role: JwtPayload['role'] = 'consumer'): string {
    const payload: JwtPayload = { sub: address, address, role };
    return this.jwt.sign(payload);
  }

  verify(token: string): JwtPayload {
    try {
      return this.jwt.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
