import '@sentry/tracing';

import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Sentry from '@sentry/node';

import { AuthModule } from './api/auth/auth.module';
import { MailModule } from './api/mail/mail.module';
import { PrismaModule } from './api/prisma/prisma.module';
import { SentryModule } from './api/sentry/sentry.module';
import { SentryService } from './api/sentry/sentry.service';
import { UsersModule } from './api/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './utils/constants/environment.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        label: 'key',
        abortEarly: true,
      },
    }),
    SentryModule.forRoot({
      dsn: process.env.SENTRY_DNS,
      tracesSampleRate: 1.0,
      debug: true,
    }),
    AuthModule,
    PrismaModule,
    UsersModule,
    MailModule,
    SentryModule,
  ],
  controllers: [AppController],
  providers: [AppService, SentryService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
