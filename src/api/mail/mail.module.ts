import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { HttpModule } from '@nestjs/axios';
import { MailConfig } from '@/config/mail.config';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: async (config: ConfigService) => ({
        useClass: MailService,
        baseURL: config.get('MAIL_API_BASE_URL'),
        headers: {
          // Subject to change according to your service
          'Api-Key': config.get('MAIL_API_KEY'),
        },
        data: {
          // Add you initial data here (sender email and name)
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
