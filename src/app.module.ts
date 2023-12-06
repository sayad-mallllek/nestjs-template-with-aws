import {
  Logger,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './api/auth/auth.module';
import { PrismaModule } from './api/prisma/prisma.module';
import { UsersModule } from './api/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import '@sentry/tracing';
import * as Sentry from '@sentry/node';
import { validationSchema } from './config/environment.config';
import { SentryModule } from './integrations/sentry/sentry.module';
import { IS_DEPLOYED } from './utils/functions/constants/environment.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        label: 'key',
      },
      validate(config) {
        try {
          validationSchema.validateSync(config, {
            abortEarly: false,
          });
        } catch (error) {
          error.errors.forEach((e) => {
            Logger.error(e);
          });

          if (!IS_DEPLOYED) process.exit(1);
        }

        return config;
      },
    }),
    SentryModule.forRoot({
      dsn: process.env.SENTRY_DNS,
      tracesSampleRate: 1.0,
      debug: true,
      enabled: process.env.NODE_ENV !== 'development',
    }),
    ,
    AuthModule,
    PrismaModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
