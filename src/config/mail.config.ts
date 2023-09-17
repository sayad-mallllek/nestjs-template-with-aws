import { Injectable } from '@nestjs/common';

//TODO add to env
// AND CHANGE THE SENDER EMAIL AND NAME
@Injectable()
export class MailConfig {
  baseURL = process.env.MAIL_API_BASE_URL;
  apiKey = process.env.MAIL_API_KEY;
  senderEmail = process.env.MAIL_API_SENDER_EMAIL;
  senderName = process.env.MAIL_API_SENDER_NAME;
}
