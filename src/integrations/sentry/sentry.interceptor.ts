import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { catchError, finalize, Observable, throwError } from 'rxjs';

import { SentryService } from './sentry.service';

/**
 * We must be in Request scope as we inject SentryService
 */
@Injectable({ scope: Scope.REQUEST })
export class SentryInterceptor implements NestInterceptor {
  constructor(private sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // start a child span for performance tracing
    const span = this.sentryService.startChild({ op: `route handler` });

    return next.handle().pipe(
      catchError((error) => {
        const { tags, ...traceContext } =
          this.sentryService.span.getTraceContext();
        // capture the error, you can filter out some errors here
        Sentry.captureException(error, traceContext);

        // throw again the error
        return throwError(() => error);
      }),
      finalize(() => {
        span.finish();
        this.sentryService.span.finish();
      }),
    );
  }
}
