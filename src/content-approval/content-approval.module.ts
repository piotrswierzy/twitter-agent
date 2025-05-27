import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentApprovalService } from './content-approval.service';
import { DbModule } from '../db/db.module';
import { TwitterModule } from '../twitter/twitter.module';
import { TelegramApprovalStrategy } from './strategies/telegram-approval.strategy';
import { TelegramBotService } from './bots/telegram.bot';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    TwitterModule,
  ],
  providers: [
    ContentApprovalService,
    TelegramApprovalStrategy,
    TelegramBotService,
    {
      provide: 'APPROVAL_STRATEGY',
      useFactory: (strategy: TelegramApprovalStrategy) => strategy,
      inject: [TelegramApprovalStrategy],
    },
  ],
  exports: [ContentApprovalService],
})
export class ContentApprovalModule {}
