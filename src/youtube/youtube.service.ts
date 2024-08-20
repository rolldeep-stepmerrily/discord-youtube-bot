import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google, youtube_v3 } from 'googleapis';

@Injectable()
export class YoutubeService {
  private youtube: youtube_v3.Youtube;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }

  async findVideo(q: string, limit: number = 5): Promise<youtube_v3.Schema$SearchResult[]> {
    try {
      const response = await this.youtube.search.list({
        part: ['id', 'snippet'],
        q,
        type: ['video'],
        maxResults: limit,
      });

      if (!response.data.items) {
        return [];
      }

      return response.data.items;
    } catch (e) {
      console.error(e);

      throw new InternalServerErrorException();
    }
  }
}
