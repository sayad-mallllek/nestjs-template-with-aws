import { Global, Logger, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
