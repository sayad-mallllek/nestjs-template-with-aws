import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [HttpModule],
  controllers: [AuthController],
  providers: [AuthService, MailService],
})
export class AuthModule {}
