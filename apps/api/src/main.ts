import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Atrás de proxy (Railway/Render/Nginx): necessário para o IP real no rate limit e auditoria.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableCors({
    origin: config.get<string[]>('CORS_ORIGINS'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não declarados nos DTOs
      forbidNonWhitelisted: true, // e rejeita a requisição se vierem
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('API Arquijo Marmoraria e Marcenaria')
    .setDescription('OS, cálculo de chapas, catálogo, financeiro, B2B e WhatsApp — MVP Fase 1')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const porta = config.get<number>('PORT') ?? 3001;
  await app.listen(porta);
  logger.log(`API ouvindo na porta ${porta} — Swagger em /docs`);
}

void bootstrap();
