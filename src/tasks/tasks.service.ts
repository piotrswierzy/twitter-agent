import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AgentOrchestrator } from './agent-orchestrator.service';

/**
 * Service responsible for scheduling and managing background tasks.
 * This service uses the @nestjs/schedule package to run tasks at specified intervals.
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly agentOrchestrator: AgentOrchestrator) {}

  /**
   * Scheduled task that processes new tweets every 5 minutes.
   * This task:
   * 1. Fetches unprocessed tweets
   * 2. Generates replies
   * 3. Sends them for approval
   */
  @Cron(CronExpression.EVERY_HOUR, { waitForCompletion: true })
  async handleProcessNewTweets() {
    try {
      this.logger.log('Starting scheduled task: Process new tweets');
      const processedCount = await this.agentOrchestrator.processNewTweets();
      this.logger.log(`Completed processing ${processedCount} tweets`);
    } catch (error) {
      this.logger.error('Failed to process new tweets', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
  async handlePostApprovedReplies() {
    try {
      this.logger.log('Starting scheduled task: Post approved replies');
      console.log('date now', Date.now());
      const postedCount = await this.agentOrchestrator.postApprovedReplies();
      this.logger.log(`Completed posting ${postedCount} replies`);
    } catch (error) {
      this.logger.error('Failed to post approved replies', error.stack);
    }
  }
}
