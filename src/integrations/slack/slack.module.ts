import { Module } from '@nestjs/common';

import { SlackConfig } from '@/config/slack.config';

import { SlackService } from './slack.service';

/*
If you are going to use the Slack service almost everywhere, it may be a good idea to make it global.
*/
// @Global()
@Module({
  providers: [SlackService, SlackConfig],
  exports: [SlackService],
})
export class SlackModule {}
