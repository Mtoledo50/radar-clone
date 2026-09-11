import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { initSentry } from './common/monitoring/sentry';
import { SentryExceptionFilter } from './filters/sentry-exception.filter';

async function bootstrap() {
  // Inicializa a aplicação com suporte a bodyParser nativo
  const app = await NestFactory.create(AppModule, {
    // 🆕 Sprint 10: aumenta limite para suportar importação de planilhas grandes
    bodyParser: true,
  });

  // 🆕 Aumenta limite de payload para 10MB (importação de estoque inicial com 700+ itens)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // 🔓 CORS: aceita múltiplas origens (ambientes de dev + produção via Cloudflare)
  // Lê do .env a variável FRONTEND_URL (separada por vírgulas) ou usa o fallback abaixo
  const frontendUrlEnv = process.env.FRONTEND_URL || '';
  const allowedOrigins = frontendUrlEnv
    ? frontendUrlEnv.split(',').map((u) => u.trim()).filter(Boolean)
    : [
        // 🖥️ Ambientes de Desenvolvimento Local
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3005',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003',
        'http://127.0.0.1:3005',
        
        // 🌐 Ambientes de Produção (Cloudflare Tunnel)
        'https://www.contacerta.com.br',          // Site Principal (Vite)
        'https://radar.contacerta.com.br',        // Frontend do Painel Radar (Next.js)
        'https://radar-api.contacerta.com.br',    // Backend da API do Radar (NestJS)
        'https://extrator.contacerta.com.br',     // Frontend do Extrator Bancário (Vite)
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Permite envio de cookies/credenciais entre origens diferentes
  });

  // 🛡️ Habilita validação global de DTOs em todas as rotas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Remove campos não definidos no DTO (Segurança)
      forbidNonWhitelisted: true,// Rejeita requests que enviam campos extras inesperados
      transform: true,           // Transforma strings de requisição nos tipos corretos (ex: string para number)
    }),
  );

  // 🛡️ FASE 3: Registra o filtro global de exceções para capturar erros e enviar ao Sentry (ADR-088)
  app.useGlobalFilters(new SentryExceptionFilter());

  // 🆕 Sprint 33: monitoramento opt-in (ADR-088)
  const sentryOn = initSentry(app);
  console.log(sentryOn ? '🛡️ Sentry ativo' : '🛡️ Sentry desativado (sem DSN)');

  // Inicia o servidor na porta 3001
  await app.listen(3001);
  console.log(`🚀 Backend rodando em http://localhost:3001`);
  console.log(`🔓 CORS habilitado para: ${allowedOrigins.join(', ')}`);
}

bootstrap();