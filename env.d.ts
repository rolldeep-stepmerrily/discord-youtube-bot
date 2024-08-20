declare namespace NodeJS {
  interface ProcessEnv {
    DISCORD_BOT_TOKEN: string;
    YOUTUBE_API_KEY: string;
    SERVER_PORT: number;
    FFMPEG_PATH: string | null;
  }
}
