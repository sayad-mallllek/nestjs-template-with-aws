import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './api/prisma/prisma.module';
import { AuthModule } from './api/auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
