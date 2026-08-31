import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { initSentry } from './common/monitoring/sentry';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 🆕 Sprint 10: aumenta limite para suportar importação de planilhas grandes
    bodyParser: true,
  });

  // 🆕 Aumenta limite de payload para 10MB (importação de estoque inicial com 700+ itens)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // 🔓 CORS: aceita múltiplas origens (dev + produção)
  // Lê do env FRONTEND_URL (comma-separated) ou usa fallback com portas dev
  const frontendUrlEnv = process.env.FRONTEND_URL || '';
  const allowedOrigins = frontendUrlEnv
    ? frontendUrlEnv.split(',').map((u) => u.trim()).filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3003',   // 🆕 dev Radar (3000 ocupado pelo site)
        'http://localhost:3005',   // 🆕 dev Radar alternativo
        'https://radar.contacerta.com.br',  // 🆕 produção
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003',
        'http://127.0.0.1:3005',
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // 🛡️ Habilita validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Remove campos não definidos no DTO (Segurança)
      forbidNonWhitelisted: true, // Rejeita requests com campos extras
      transform: true,          // Transforma strings em tipos corretos
    }),
  );

  // 🛡️ FASE 3: Registra o filtro global de exceções para capturar erros e enviar ao Sentry (ADR-088)
  app.useGlobalFilters(new SentryExceptionFilter());

  // 🆕 Sprint 33: monitoramento opt-in (ADR-088)
  const sentryOn = initSentry(app);
  console.log(sentryOn ? '🛡️ Sentry ativo' : '🛡️ Sentry desativado (sem DSN)');

  await app.listen(3001);
  console.log(`🚀 Backend rodando em http://localhost:3001`);
  console.log(`🔓 CORS habilitado para: ${allowedOrigins.join(', ')}`);
}

bootstrap();