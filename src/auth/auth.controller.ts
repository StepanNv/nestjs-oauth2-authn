import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiExtraModels,
  ApiFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  GithubMeResponseDto,
  GoogleMeResponseDto,
  type MeResponseDto,
} from './dto/me-response.dto.js';

type AuthenticatedRequest = Request & { user?: MeResponseDto };

@ApiTags('auth')
@ApiExtraModels(GoogleMeResponseDto, GithubMeResponseDto)
@Controller('auth')
export class AuthController {
  @Get('google/login')
  @ApiOperation({
    summary: 'Sign in with Google',
    description: 'Open this URL in a browser to sign in with Google.',
  })
  @ApiFoundResponse({
    description: 'Redirect to the Google sign-in page',
    headers: { Location: { schema: { type: 'string', format: 'uri' } } },
  })
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    req.login(req.user!, (err) => {
      if (err) {
        res.status(500).json({
          message: 'Failed to save session',
        });
        return;
      }

      res.redirect('/auth/me');
    });
  }

  @Get('github/login')
  @ApiOperation({
    summary: 'Sign in with GitHub',
    description: 'Open this URL in a browser to sign in with GitHub.',
  })
  @ApiFoundResponse({
    description: 'Redirect to the GitHub sign-in page',
    headers: { Location: { schema: { type: 'string', format: 'uri' } } },
  })
  @UseGuards(AuthGuard('github'))
  githubLogin() {}

  @Get('github/callback')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req: Request, @Res() res: Response) {
    req.login(req.user!, (err) => {
      if (err) {
        res.status(500).json({
          message: 'Failed to save session',
        });
        return;
      }

      res.redirect('/auth/me');
    });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Sign out' })
  @ApiCookieAuth()
  @ApiNoContentResponse({ description: 'Session ended' })
  async logout(@Req() req: Request, @Res() res: Response) {
    await new Promise<void>((resolve, reject) => {
      req.logout((err: unknown) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err: unknown) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });

    res.clearCookie('connect.sid', { path: '/' });
    res.status(204).send();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current user' })
  @ApiCookieAuth()
  @ApiOkResponse({
    description: 'User profile. The format depends on the sign-in provider.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(GoogleMeResponseDto) },
        { $ref: getSchemaPath(GithubMeResponseDto) },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  me(@Req() req: AuthenticatedRequest): MeResponseDto {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    return req.user;
  }
}
