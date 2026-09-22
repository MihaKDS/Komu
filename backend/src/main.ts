import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { mkdirSync } from 'fs';
import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
const uploadDir = join(process.cwd(), 'uploads', 'covers');
mkdirSync(uploadDir, { recursive: true });

app.use('/uploads/covers', express.static(uploadDir));
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);

}
bootstrap();
