import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  @Get('login')
  @UseGuards(AuthGuard('oidc'))
  login() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('oidc'))
  callback(@Req() req: Request, @Res() res: Response) {
    req.login(req.user!, () => res.redirect('/'));
  }

  @Get('me')
  me(@Req() req: Request) {
    return req.user ?? null;
  }
}