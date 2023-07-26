import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './api/prisma/prisma.module';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, PrismaModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
