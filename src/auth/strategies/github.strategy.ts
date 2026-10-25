import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import type { GithubMeResponseDto } from '../dto/me-response.dto.js';

type GithubProfile = {
  id: number;
  login: string;
  name: string | null;
};

function isGithubProfile(value: unknown): value is GithubProfile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    'login' in value &&
    typeof value.login === 'string' &&
    'name' in value &&
    (typeof value.name === 'string' || value.name === null)
  );
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      clientID: configService.getOrThrow('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GITHUB_REDIRECT_URI'),
      state: true,
      pkce: true,
    });
  }

  async validate(accessToken: string): Promise<GithubMeResponseDto> {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException();
    }

    const data: unknown = await response.json();

    if (!isGithubProfile(data)) {
      throw new UnauthorizedException('Invalode GitHub profile');
    }

    // Проверки прошли, TypeScript считает data объектом GithubProfile.
    return {
      provider: 'github',
      providerId: String(data.id),
      login: data.login,
      name: data.name,
    };
  }
}
