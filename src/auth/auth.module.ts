import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import * as client from 'openid-client';
import { AuthController } from './auth.controller.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { GithubStrategy } from './strategies/github.strategy.js';

@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [
    {
      // Сборка конфига OIDC, что бы передать его в стратегию
      provide: client.Configuration,
      useFactory: () =>
        client.discovery(
          new URL(process.env.GOOGLE_ISSUER!),
          process.env.GOOGLE_CLIENT_ID!,
          process.env.GOOGLE_CLIENT_SECRET!,
        ),
    },
    GoogleStrategy,
    GithubStrategy
  ],
})
export class AuthModule {}
