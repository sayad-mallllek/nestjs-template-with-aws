import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { V1Module } from './api/v1/v1.module';
import { PrismaModule } from './api/prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot(), V1Module, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
