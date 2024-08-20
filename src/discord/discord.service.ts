import { createAudioPlayer, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { Client, EmbedBuilder, GatewayIntentBits, Message, MessageReaction, User, VoiceChannel } from 'discord.js';

import { YoutubeService } from 'src/youtube/youtube.service';

@Injectable()
export class DiscordService implements OnModuleInit {
  private client: Client;
  private voiceConnection: VoiceConnection | null = null;
  private audioPlayer: any = null;

  constructor(private readonly youtubeService: YoutubeService) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    this.audioPlayer = createAudioPlayer();
  }

  async onModuleInit() {
    this.client.on('ready', () => {
      console.log(this.client.user?.tag);
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

    const voiceChannel = message.member?.voice.channel;

    if (!voiceChannel) {
      message.reply('음성 채널에 아무도 없습니다!');

      return;
    }

    await this.connectToVoiceChannel(voiceChannel as VoiceChannel);

    try {
      const results = await this.youtubeService.findVideo(q);

      if (!results || !results.length) {
        message.reply('검색 결과가 없습니다.');

        return;
      }

      const embed = new EmbedBuilder().setTitle('검색 결과').setColor(0xff0000).setDescription('영상을 선택해주세요!');

      const fields = results.map((result, index) => {
        return {
          name: `${index + 1}. ${result.snippet?.title ?? ''}`,
          value: result.snippet?.description?.substring(0, 100) + '...' ?? '',
        };
      });

      embed.addFields(fields);

      const sentMessage = await message.channel.send({ embeds: [embed] });

      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

      for (let i = 0; i < results.length; i++) {
        await sentMessage.react(emojis[i]);
      }

      const filter = (reaction: MessageReaction, user: User) =>
        emojis.includes(reaction.emoji.name ?? '') && user.id === message.author.id;

      const collected = await sentMessage.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] });

      const reaction = collected.first();

      if (reaction) {
        const index = emojis.indexOf(reaction.emoji.name ?? '');

        const selected = results[index];

        if (!selected || !selected.id?.videoId) {
          message.reply('선택한 영상의 정보가 없습니다.');
        }

        if (selected.id) {
          await this.audioPlayer(selected.id.videoId, message);
        }
      }
    } catch (e) {
      console.error(e);

      message.reply('에러가 발생했습니다.');
    }
  }

  async connectToVoiceChannel(voiceChannel: VoiceChannel) {
    try {
      this.voiceConnection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });
    } catch (e) {
      console.error(e);

      throw new InternalServerErrorException();
    }
  }
}
