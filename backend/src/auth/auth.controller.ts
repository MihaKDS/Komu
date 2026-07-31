import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
    }
    
    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@Req() req: any) {
    return {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        city: req.user.city,
    };
    }
}