import { Injectable, Logger, Inject } from '@nestjs/common';
import { ApprovalStrategy } from './interfaces/approval-strategy.interface';
import { Tweet } from '../db/entities/tweet.entity';
import { Reply } from '../db/entities/reply.entity';

/**
 * Service responsible for managing content approval through different strategies.
 * Uses the Strategy pattern to allow different approval mechanisms (Telegram, Discord, etc.).
 */
@Injectable()
export class ContentApprovalService {
  private readonly logger = new Logger(ContentApprovalService.name);

  constructor(
    @Inject('APPROVAL_STRATEGY')
    private readonly strategy: ApprovalStrategy,
  ) {
    this.logger.log(`Using approval strategy: ${strategy.constructor.name}`);
  }

  /**
   * Sends a tweet and its reply for approval using the current strategy.
   * @param tweet The tweet to be approved
   * @param reply The generated reply to be approved
   */
  async sendForApproval(tweet: Tweet, reply: Reply): Promise<void> {
    await this.strategy.sendForApproval(tweet, reply);
  }

  /**
   * Handles the approval of a reply using the current strategy.
   * @param tweetId The ID of the tweet being replied to
   * @param replyId The ID of the reply being approved
   */
  async handleApprove(tweetId: string, replyId: string): Promise<void> {
    await this.strategy.handleApprove(tweetId, replyId);
  }

  /**
   * Handles the rejection of a reply using the current strategy.
   * @param tweetId The ID of the tweet being replied to
   * @param replyId The ID of the reply being rejected
   */
  async handleReject(tweetId: string, replyId: string): Promise<void> {
    await this.strategy.handleReject(tweetId, replyId);
  }

  /**
   * Handles the editing of a reply using the current strategy.
   * @param tweetId The ID of the tweet being replied to
   * @param replyId The ID of the reply being edited
   * @param editedText The new text for the reply
   */
  async handleEdit(tweetId: string, replyId: string, editedText: string): Promise<void> {
    await this.strategy.handleEdit(tweetId, replyId, editedText);
  }
}
