import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './api/auth/auth.module';
import { PrismaModule } from './api/prisma/prisma.module';
import { UsersModule } from './api/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailResolver } from './api/mail/mail.resolver';
import { MailModule } from './api/mail/mail.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, PrismaModule, UsersModule, MailModule],
  controllers: [AppController],
  providers: [AppService, MailResolver],
})
export class AppModule {}
