import { Injectable } from '@nestjs/common';
import { Block, KnownBlock, WebClient } from '@slack/web-api';
import { SlackConfig } from 'src/config/slack.config';

const DEFAULT_SLACK_CHANNEL = 'your_chanel';

@Injectable()
export class SlackService {
  private slack: WebClient;
  constructor(private readonly slackConfig: SlackConfig) {
    this.slack = new WebClient(this.slackConfig.token);
  }

  async sendMessage(message: string, channel?: string) {
    try {
      await this.slack.chat.postMessage({
        channel: channel || DEFAULT_SLACK_CHANNEL,
        text: message,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async sendBlocks(blocks: (Block | KnownBlock)[], channel?: string) {
    try {
      await this.slack.chat.postMessage({
        channel: channel || DEFAULT_SLACK_CHANNEL,
        blocks,
      });
    } catch (error) {
      console.error(error);
    }
  }
}
