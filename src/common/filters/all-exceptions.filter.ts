import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{ url: string; method: string }>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const response = isHttp ? exception.getResponse() : 'Internal server error';
    const message =
      typeof response === 'string'
        ? response
        : ((response as { message?: string | string[] }).message ?? exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    httpAdapter.reply(
      ctx.getResponse(),
      {
        statusCode: status,
        message,
        path: httpAdapter.getRequestUrl(ctx.getRequest()) as string,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
