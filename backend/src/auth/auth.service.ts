import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto){

    const {
            username,
            email,
            password,
            city,
        } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Username or email already exists',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        city,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        city: user.city,
      },
    };
  }

  async login(loginDto: LoginDto) {

  const { email, password } = loginDto;

  const user = await this.prisma.user.findUnique({
    where: {
      email,
    },
  });
console.log(user);
  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const token = this.jwtService.sign({
    sub: user.id,
    username: user.username,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      city: user.city,
    },
  };
}
}