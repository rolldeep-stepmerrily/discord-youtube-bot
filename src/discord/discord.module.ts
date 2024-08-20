import { Module } from '@nestjs/common';

import { YoutubeModule } from 'src/youtube/youtube.module';
import { DiscordService } from './discord.service';

@Module({
  imports: [YoutubeModule],
  providers: [DiscordService],
})
export class DiscordModule {}
