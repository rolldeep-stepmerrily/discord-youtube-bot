import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, EmbedBuilder, GatewayIntentBits, Message } from 'discord.js';

import { YoutubeService } from 'src/youtube/youtube.service';

@Injectable()
export class DiscordService implements OnModuleInit {
  private client: Client;

  constructor(private readonly youtubeService: YoutubeService) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });
  }

  async onModuleInit() {
    this.client.on('ready', () => {
      // console.log(this.client.user.tag);
    });

    this.client.on('messageCreate', (message: Message) => {
      this.handleMessage(message);
    });

    await this.client.login(process.env.DISCORD_BOT_TOKEN);
  }

  async handleMessage(message: Message) {
    if (message.author.bot) {
      return false;
    }

    if (message.content.startsWith('@play')) {
      await this.handlePlayCommand(message);
    }

    if (message.content.startsWith('@list')) {
      message.channel.send('list'); //TODO
    }

    if (message.content.startsWith('@delete')) {
      message.channel.send('delete'); //TODO
    }
  }

  async handlePlayCommand(message: Message) {
    const q = message.content.slice(6).trim();

    if (!q) {
      message.reply('검색어를 입력해주세요!');

      return;
    }

    try {
      const results = await this.youtubeService.findVideo(q);
      const embed = new EmbedBuilder().setTitle('검색 결과').setColor(0xff0000).setDescription('영상을 선택해주세요!');

      const fields = results.map((result, index) => {
        return {
          name: `${index + 1}. ${result.snippet?.title ?? ''}`,
          value: result.snippet?.description ?? '',
        };
      });

      if (!fields || !fields.length) {
        message.reply('검색 결과가 없습니다.');

        return;
      }

      embed.addFields(fields);

      const sentMessage = await message.channel.send({ embeds: [embed] });
      for (let i = 0; i < results.length; i++) {
        await sentMessage.react(`${i + 1}️⃣`);
      }
    } catch (e) {
      console.error(e);

      message.reply('에러가 발생했습니다.');
    }
  }
}