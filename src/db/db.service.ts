import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tweet } from './entities/tweet.entity';
import { Reply, ReplyMetadata } from './entities/reply.entity';

/**
 * Service responsible for database operations related to tweets and replies.
 */
@Injectable()
export class DbService {
  private readonly logger = new Logger(DbService.name);

  constructor(
    @InjectRepository(Tweet)
    private readonly tweetRepository: Repository<Tweet>,
    @InjectRepository(Reply)
    private readonly replyRepository: Repository<Reply>,
  ) {}

  /**
   * Retrieves tweets that haven't been replied to yet.
   * 
   * @returns Promise resolving to an array of unreplied tweets
   */
  async getUnrepliedTweets(): Promise<Tweet[]> {
    return this.tweetRepository.find({
      where: { replied: false },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Updates a tweet with the provided data.
   * 
   * @param id The ID of the tweet to update
   * @param data The data to update
   * @returns Promise resolving to the updated tweet
   */
  async updateTweet(id: string, data: Partial<Tweet>): Promise<Tweet> {
    await this.tweetRepository.update(id, data);
    return this.tweetRepository.findOne({ where: { id } });
  }

  /**
   * Saves a new reply to the database.
   * 
   * @param data The reply data to save
   * @returns Promise resolving to the saved reply
   */
  async saveReply(data: {
    tweetId: string;
    replyText: string;
    approved: boolean;
    posted: boolean;
    metadata?: ReplyMetadata;
  }): Promise<Reply> {
    const reply = this.replyRepository.create({
      tweet: { id: data.tweetId },
      replyText: data.replyText,
      approved: data.approved,
      posted: data.posted,
      metadata: data.metadata || null,
    });
    const savedReply = await this.replyRepository.save(reply);
    return this.replyRepository.findOne({
      where: { id: savedReply.id },
      relations: ['tweet'],
    });
  }

  /**
   * Retrieves replies based on the provided criteria.
   * 
   * @param criteria The criteria to filter replies
   * @returns Promise resolving to an array of matching replies
   */
  async getReplies(criteria: {
    approved?: boolean;
    posted?: boolean;
  }): Promise<Reply[]> {
    return this.replyRepository.find({
      where: criteria,
      relations: ['tweet'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Updates a reply with the provided data.
   * 
   * @param id The ID of the reply to update
   * @param data The data to update
   * @returns Promise resolving to the updated reply
   */
  async updateReply(id: string, data: Partial<Reply>): Promise<Reply> {
    await this.replyRepository.update(id, data);
    return this.replyRepository.findOne({
      where: { id },
      relations: ['tweet'],
    });
  }

  async saveTweet(tweetData: Partial<Tweet>): Promise<Tweet> {
    try {
      const tweet = this.tweetRepository.create(tweetData);
      return await this.tweetRepository.save(tweet);
    } catch (error) {
      this.logger.error(`Failed to save tweet: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTweetById(id: string): Promise<Tweet | null> {
    try {
      return await this.tweetRepository.findOne({
        where: { id },
        relations: ['replies'],
      });
    } catch (error) {
      this.logger.error(`Failed to get tweet: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPendingReplies(): Promise<Reply[]> {
    try {
      return await this.replyRepository.find({
        where: { approved: true, posted: false },
        relations: ['tweet'],
      });
    } catch (error) {
      this.logger.error(`Failed to get pending replies: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markReplyAsPosted(id: string): Promise<void> {
    try {
      await this.replyRepository.update(id, {
        posted: true,
        postedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to mark reply as posted: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTweetsBySource(source: string): Promise<Tweet[]> {
    try {
      return await this.tweetRepository.find({
        where: { source },
        relations: ['replies'],
      });
    } catch (error) {
      this.logger.error(`Failed to get tweets by source: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReplyById(id: string): Promise<Reply | null> {
    try {
      return await this.replyRepository.findOne({
        where: { id },
        relations: ['tweet'],
      });
    } catch (error) {
      this.logger.error(`Failed to get reply: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieves all tweet IDs from the database.
   * This is used to filter out tweets that have already been processed.
   * 
   * @returns Promise resolving to an array of tweet IDs
   */
  async getAllTweetIds(): Promise<{ id: string }[]> {
    try {
      return await this.tweetRepository.find({
        select: ['id'],
      });
    } catch (error) {
      this.logger.error(`Failed to get all tweet IDs: ${error.message}`, error.stack);
      throw error;
    }
  }
}
