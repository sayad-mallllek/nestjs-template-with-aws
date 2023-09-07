import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { HttpModule } from '@nestjs/axios';
import { MailConfig } from '@/config/mail.config';

@Module({
  imports: [HttpModule.registerAsync({
    useFactory: async (config: MailConfig) => ({
      baseURL: config.baseURL,
      headers: {
        // Subject to renaming according to your service
        "Api-Key": config.apiKey,
      },
      data: {
        // Add you initial data here (sender email and name)
      }
    }),
    inject: [MailConfig]
  })],
  controllers: [MailController],
  providers: [MailService]
})
export class MailModule { }
