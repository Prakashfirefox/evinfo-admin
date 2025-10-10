import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import express from 'express';
import path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Serve uploaded files
  // Serve uploaded files from /uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
