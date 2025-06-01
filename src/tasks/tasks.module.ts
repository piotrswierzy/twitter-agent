import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../db/db.module';
import { TwitterModule } from '../twitter/twitter.module';
import { ContentApprovalModule } from '../content-approval/content-approval.module';
import { ContentGeneratorModule } from '../content-generator/content-generator.module';
import { TasksService } from './tasks.service';
import { AgentOrchestrator } from './agent-orchestrator.service';
import { PostingSchedulerService } from './posting-scheduler.service';

/**
 * Module responsible for managing scheduled tasks and background processes.
 * This module coordinates the execution of various tasks such as:
 * - Processing new tweets
 * - Posting approved replies
 * - Other periodic maintenance tasks
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DbModule,
    TwitterModule,
    ContentGeneratorModule,
    forwardRef(() => ContentApprovalModule),
  ],
  providers: [
    TasksService,
    AgentOrchestrator,
    PostingSchedulerService,
  ],
  exports: [
    TasksService,
    AgentOrchestrator,
    PostingSchedulerService,
  ],
})
export class TasksModule {}
