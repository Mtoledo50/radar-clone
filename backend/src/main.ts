import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 🆕 Sprint 10: aumenta limite para suportar importação de planilhas grandes
    bodyParser: true,
  });
  
  // 🆕 Aumenta limite de payload para 10MB (importação de estoque inicial com 700+ itens)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

   // 🛡️ Habilita validação global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove campos não definidos no DTO (Segurança)
    forbidNonWhitelisted: true, // Rejeita requests com campos extras
    transform: true, // Transforma strings em
    }),
  );

  await app.listen(3001);
  console.log('🚀 Backend rodando em http://localhost:3001');
}

bootstrap();
