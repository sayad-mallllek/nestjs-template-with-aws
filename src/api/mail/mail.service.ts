import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly httpService: HttpService) {}

  sendTemplateEmail = async (payload: unknown) => {
    // Implement your Email API Logic here
  };
}
