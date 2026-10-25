import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  @Get('google/login')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
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
  @UseGuards(AuthGuard('github'))
  githubLogin() {}

  @Get('github/callback')
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
  me(@Req() req: Request) {
    return req.user ?? null;
  }
}
