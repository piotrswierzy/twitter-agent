import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwitterService } from './twitter.service';
import { TweetFilterService } from './tweet-filter.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [ConfigModule, DbModule],
  providers: [TwitterService, TweetFilterService],
  exports: [TwitterService, TweetFilterService]
})
export class TwitterModule {}
