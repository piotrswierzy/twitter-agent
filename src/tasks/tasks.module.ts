import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AgentOrchestrator } from './agent-orchestrator.service';
import { TasksService } from './tasks.service';
import { DbModule } from '../db/db.module';
import { ContentGeneratorModule } from '../content-generator/content-generator.module';
import { ContentApprovalModule } from '../content-approval/content-approval.module';
import { TwitterModule } from '../twitter/twitter.module';

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
    DbModule,
    ContentGeneratorModule,
    ContentApprovalModule,
    TwitterModule,
  ],
  providers: [AgentOrchestrator, TasksService],
  exports: [AgentOrchestrator],
})
export class TasksModule {}
