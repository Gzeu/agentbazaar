import { Module }    from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService }  from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Module({
  imports: [
    JwtModule.register({
      secret:      process.env.JWT_SECRET ?? 'changeme-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtAuthGuard],
  exports:   [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
