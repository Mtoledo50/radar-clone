import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
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
