import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './jwt.guard';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString() address!: string;
  @IsOptional() @IsBoolean() providerMode?: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

    @Public()
  @Post('login')
  login(@Body() { address, providerMode }: LoginDto) {
    const role = providerMode ? 'provider' : 'consumer';
    const access_token = this.auth.issue(address, role);
    return { access_token, role, address };
  }
}