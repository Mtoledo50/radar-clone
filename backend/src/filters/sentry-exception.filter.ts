// =================================================================
// ARQUIVO: backend/src/filters/sentry-exception.filter.ts
// =================================================================
// Filtro global de exceções do NestJS com integração opt-in ao Sentry (ADR-088).
// Compatível com @sentry/node 8.x+ (API moderna).
// Extrai corretamente as mensagens de validação do class-validator.
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

let sentryInitialized = false;

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : 'Erro interno do servidor';

    // 🛡️ EXTRAÇÃO INTELIGENTE DA MENSAGEM DE ERRO
    let errorMessage = 'Erro interno do servidor';
    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as any;
      // Se o class-validator retornou um array de erros, unimos em uma string
      if (Array.isArray(resp.message)) {
        errorMessage = resp.message.join(', ');
      } else if (typeof resp.message === 'string') {
        errorMessage = resp.message;
      }
    }

    // 🛡️ ADR-088: Sentry opt-in
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      if (!sentryInitialized && !Sentry.getClient()) {
        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: 1.0,
        });
        sentryInitialized = true;
      }

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
      // Fallback para dev: loga no console com a mensagem real do erro
      this.logger.error(
        `HTTP ${status} - ${request.method} ${request.url} | Erro: ${errorMessage}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Retorna a mensagem real (ou unificada) para o frontend
    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}