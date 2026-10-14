import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import * as client from 'openid-client';
import { AuthController } from './auth.controller.js';
import { OidcStrategy } from './strategies/oidc.strategy.js';

@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [
    {
      // Сборка конфига OIDC, что бы передать его в стратегию
      provide: client.Configuration,
      useFactory: () =>
        client.discovery(
          new URL(process.env.ISSUER!),
          process.env.CLIENT_ID!,
          process.env.CLIENT_SECRET!,
        ),
    },
    OidcStrategy,
  ],
})
export class AuthModule {}