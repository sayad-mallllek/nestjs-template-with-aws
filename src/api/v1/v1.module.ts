import { Module } from '@nestjs/common';
import { V1Controller } from './v1.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  controllers: [V1Controller],
  providers: [],
  // imports: [AuthModule]
  imports: []
})
export class V1Module { }
