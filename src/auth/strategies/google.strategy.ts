import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as client from 'openid-client';
import { Strategy, type VerifyFunction } from 'openid-client/passport';
import type { GoogleMeResponseDto } from '../dto/me-response.dto.js';

type Tokens = Parameters<VerifyFunction>[0];

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: client.Configuration) {
    super({
      config,
      scope: 'openid email profile',
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    });
  }

  // Запускается после обмена кода; ID-токен уже прошел валидацию.
  // Произходит получение claims из проверенного ID token через tokens.claims() и запрос к UserInfo Endpoint через fetchUserInfo()
  // из ранее полученного id token
  async validate(tokens: Tokens): Promise<GoogleMeResponseDto> {
    const claims = tokens.claims()!;
    const info = await client.fetchUserInfo(
      this.config,
      tokens.access_token,
      claims.sub,
    );
    return { sub: claims.sub, email: info.email, name: info.name };
  }
}
