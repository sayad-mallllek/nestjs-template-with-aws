import { Injectable } from '@nestjs/common';

@Injectable()
export class SlackConfig {
  public token = process.env.SLACK_TOKEN;
}
