import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { MailController } from './mail.controller';
import { MailService } from './mail.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: () => ({
        useClass: MailService,
        baseURL: process.env.MAIL_API_BASE_URL,
        headers: {
          // Subject to change according to your service
          'Api-Key': process.env.MAIL_API_KEY,
        },
        data: {
          // Add you initial data here (sender email and name)
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
