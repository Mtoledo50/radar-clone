// =================================================================
// ARQUIVO: backend/src/filters/sentry-exception.filter.ts
// =================================================================
// Filtro global de exceções do NestJS com integração opt-in ao Sentry (ADR-088).
// Compatível com @sentry/node 8.x+ (API moderna).
// Se SENTRY_DSN não estiver definido, o erro é apenas logado no console.
// =================================================================
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';

// Flag para controlar inicialização (evita re-init em cada erro)
let sentryInitialized = false;

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Determina o status HTTP (500 para erros não HttpException)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extrai mensagem de erro segura
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erro interno do servidor';

    // 🛡️ ADR-088: Só inicializa/envia para o Sentry se o DSN estiver presente
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      // Inicialização lazy (garante que só roda uma vez por processo)
      // 🆕 API moderna do Sentry 8.x+ (substitui getCurrentHub)
      if (!sentryInitialized && !Sentry.getClient()) {
        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: 1.0,
        });
        sentryInitialized = true;
      }

      // Enriquece o erro com contexto da requisição
      Sentry.withScope((scope) => {
        scope.setUser({ id: (request as any).user?.id || 'anonymous' });
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          body: request.body,
        });
        Sentry.captureException(exception);
      });
    } else {
      // Fallback para dev: loga no console sem quebrar a aplicação
      this.logger.error(
        `HTTP ${status} - ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Retorna resposta padrão ao cliente (não vaza stack trace em produção)
    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : 'Erro processado',
      timestamp: new Date().toISOString(),
    });
  }
}