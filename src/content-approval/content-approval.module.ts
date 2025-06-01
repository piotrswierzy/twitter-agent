import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../db/db.module';
import { TwitterModule } from '../twitter/twitter.module';
import { ContentApprovalService } from './content-approval.service';
import { TelegramApprovalStrategy } from './strategies/telegram-approval.strategy';
import { TelegramBotService } from './bots/telegram.bot';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    TwitterModule,
    forwardRef(() => TasksModule),
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
