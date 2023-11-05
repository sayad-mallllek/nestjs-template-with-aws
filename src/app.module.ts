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
import { validationSchema } from './config/environment.config';
import * as path from 'path';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        label: 'key',
        abortEarly: true,
      },
    }),
    SentryModule.forRoot({
      dsn: process.env.SENTRY_DNS,
      tracesSampleRate: 1.0,
      debug: true,
      enabled: process.env.NODE_ENV !== 'development',
    }),
    AuthModule,
    PrismaModule,
    UsersModule,
    MailModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'l'] },
        AcceptLanguageResolver,
        CookieResolver,
      ],
      typesOutputPath: path.join(__dirname, '../src/types/i18n.types.ts'),
    }),
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
