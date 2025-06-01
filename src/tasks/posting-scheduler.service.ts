import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { postingScheduleConfig } from '../config/posting-schedule.config';
import { Reply } from '../db/entities/reply.entity';

@Injectable()
export class PostingSchedulerService {
  private readonly logger = new Logger(PostingSchedulerService.name);

  constructor(
    private readonly dbService: DbService,
  ) {}

  /**
   * Calculate next posting time based on schedule
   */
  private calculateNextPostTime(): Date {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const minDelay = postingScheduleConfig.delayBetweenPosts.min;
    const maxDelay = postingScheduleConfig.delayBetweenPosts.max;

    const start = new Date(now);
    if (now.getHours() < postingScheduleConfig.activeHours.start) {
      start.setHours(postingScheduleConfig.activeHours.start, 0, 0, 0);
    }


    const end = new Date(now);
    end.setHours(postingScheduleConfig.activeHours.end, 0, 0, 0);
    const randomTime = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    randomTime.setMinutes(randomTime.getMinutes() + delay);

    return randomTime;
  }

  /**
   * Schedule a reply for posting
   */
  async scheduleReply(reply: Reply): Promise<Date> {
    const nextTime = this.calculateNextPostTime();
    const updatedReply = await this.dbService.updateReply(reply.id, {
      scheduledFor: nextTime,
    });
    this.logger.debug(`Scheduled reply ${reply.id} for ${nextTime}`);
    return updatedReply.scheduledFor;
  }
} 