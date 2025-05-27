import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { ContentGeneratorService } from '../content-generator/content-generator.service';
import { ContentApprovalService } from '../content-approval/content-approval.service';
import { TwitterService } from '../twitter/twitter.service';
import { TweetFilterService } from '../twitter/tweet-filter.service';
import { Tweet } from '../db/entities/tweet.entity';
import { Reply, ReplyMetadata } from '../db/entities/reply.entity';
import { twitterMonitoringConfig } from '../config/twitter-monitoring.config';

/**
 * Service responsible for orchestrating the Twitter AI agent workflow.
 * This service acts as the central coordinator for the entire agent system, managing:
 * 1. Tweet monitoring and processing
 * 2. AI-powered reply generation
 * 3. Human approval workflow
 * 4. Reply posting and status tracking
 * 
 * The orchestrator ensures that all components work together seamlessly
 * while maintaining proper error handling and logging.
 */
@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);

  constructor(
    private readonly dbService: DbService,
    private readonly contentGenerator: ContentGeneratorService,
    private readonly contentApproval: ContentApprovalService,
    private readonly twitterService: TwitterService,
    private readonly tweetFilter: TweetFilterService,
  ) {}

  /**
   * Orchestrates the processing of new tweets through the agent workflow.
   * This method is designed to be called by scheduled tasks.
   * 
   * @returns Promise resolving to the number of tweets processed
   */
  async processNewTweets(): Promise<number> {
    try {
      // First, fetch new tweets from Twitter
      const newTweets = await this.fetchNewTweets();
      this.logger.log(`Fetched ${newTweets.length} new tweets from Twitter`);

      // Save new tweets to database
      for (const tweet of newTweets) {
        try {
          await this.dbService.saveTweet({
            id: tweet.id,
            author: tweet.author_id,
            content: tweet.text,
            timestamp: new Date(tweet.created_at),
            source: 'twitter',
            replied: false,
            approved: false,
            posted: false,
            referenced_tweets: tweet.referenced_tweets?.map(ref => ({
              type: ref.type as 'replied_to' | 'quoted' | 'retweeted',
              id: ref.id,
              text: ref.text,
              author: ref.author,
            })),
          });
        } catch (error) {
          this.logger.error(
            `Failed to save tweet ${tweet.id}: ${error.message}`,
            error.stack,
          );
          // Continue with next tweet even if one fails
        }
      }

      // Get unprocessed tweets (including newly fetched ones)
      const tweets = await this.dbService.getUnrepliedTweets();
      this.logger.log(`Found ${tweets.length} tweets to process`);

      let processedCount = 0;

      for (const tweet of tweets) {
        try {
          await this.processTweet(tweet);
          processedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to process tweet ${tweet.id}: ${error.message}`,
            error.stack,
          );
          // Continue with next tweet even if one fails
        }
      }

      return processedCount;
    } catch (error) {
      this.logger.error('Failed to process tweets', error.stack);
      throw error;
    }
  }

  /**
   * Fetches new tweets from Twitter API.
   * Fetches tweets from configured users and hashtags.
   * Only returns tweets that haven't been processed before (no replies, approvals, or rejections).
   * 
   * @returns Promise resolving to an array of new, unprocessed tweets
   * @throws Error if fetching fails
   */
  private async fetchNewTweets(): Promise<any[]> {
    try {
      const allTweets: any[] = [];

      // Fetch tweets from configured users
      for (const user of twitterMonitoringConfig.users) {
        const userTweets = await this.twitterService.fetchTweetsByUser(user, {
          maxResults: twitterMonitoringConfig.fetchSettings.maxResults,
          sortOrder: twitterMonitoringConfig.fetchSettings.sortOrder,
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
          endTime: new Date(Date.now() - 10000), // Subtract 10 seconds to meet Twitter API requirement
        });
        if (userTweets.data) {
          const filterChain = this.tweetFilter.createFilterChain(userTweets.data);
          const filteredTweets = await this.tweetFilter.filterProcessedTweets(filterChain);
          allTweets.push(...filteredTweets.tweets);
        }
      }

      // Fetch tweets from configured hashtags
      for (const hashtag of twitterMonitoringConfig.hashtags) {
        const hashtagTweets = await this.twitterService.fetchTweetsByHashtag(hashtag, {
          maxResults: twitterMonitoringConfig.fetchSettings.maxResults,
          sortOrder: twitterMonitoringConfig.fetchSettings.sortOrder,
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
          endTime: new Date(Date.now() - 10000), // Subtract 10 seconds to meet Twitter API requirement
        });
        if (hashtagTweets.data) {
          // For hashtags, use default filtering
          const result = this.tweetFilter.createFilterChain(hashtagTweets.data);
          const filteredResult = await this.tweetFilter.filterProcessedTweets(result);
          const finalResult = this.tweetFilter.filterByEngagement(
            this.tweetFilter.filterByAge(filteredResult, 24),
            this.tweetFilter.getDefaultFilterOptions()
          );
          allTweets.push(...finalResult.tweets);
        }
      }

      for (const query of twitterMonitoringConfig.queries) {
        const queryTweets = await this.twitterService.fetchTrendingTweets(query, {
          maxResults: twitterMonitoringConfig.fetchSettings.maxResults,
          sortOrder: twitterMonitoringConfig.fetchSettings.sortOrder,
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
          endTime: new Date(Date.now() - 10000), // Subtract 10 seconds to meet Twitter API requirement
        });
        if (queryTweets.data) {
          const filterChain = this.tweetFilter.createFilterChain(queryTweets.data);
          const filteredTweets = await this.tweetFilter.filterProcessedTweets(filterChain);
          const finalResult = this.tweetFilter.filterByEngagement(
            this.tweetFilter.filterByAge(filteredTweets, 24),
            this.tweetFilter.getDefaultFilterOptions()
          );
          allTweets.push(...finalResult.tweets);
        }
      }

      this.logger.debug(`Found ${allTweets.length} new, unprocessed tweets after filtering`);
      return allTweets;
    } catch (error) {
      this.logger.error('Failed to fetch new tweets', error.stack);
      throw error;
    }
  }

  /**
   * Processes a single tweet through the complete agent workflow.
   * 
   * @param tweet The tweet to process
   * @throws Error if any step of the process fails
   */
  private async processTweet(tweet: Tweet): Promise<void> {
    this.logger.debug(`Processing tweet ${tweet.id} from @${tweet.author}`);

    // Convert tweet to context for content generation
    const context = {
      id: tweet.id,
      text: tweet.content,
      createdAt: tweet.timestamp,
      author: tweet.author,
      referenced_tweets: tweet.referenced_tweets?.map(ref => ({
        type: ref.type,
        id: ref.id,
        text: ref.text,
        author: ref.author,
      })),
    };
    // Generate reply
    const generatedReply = await this.contentGenerator.generateReply(context, ['friendly', 'humorous', 'curious']);
    if (!generatedReply) {
      throw new Error('Failed to generate reply');
    }

    // Save reply to database with metadata
    const reply = await this.dbService.saveReply({
      tweetId: tweet.id,
      replyText: generatedReply.content,
      approved: false,
      posted: false,
      metadata: generatedReply.metadata as ReplyMetadata,
    });

    this.logger.debug(`Generated reply ${reply.id} for tweet ${tweet.id}`);

    // Send for approval
    await this.contentApproval.sendForApproval(tweet, reply);
    this.logger.debug(`Sent reply ${reply.id} for approval`);

    // Mark tweet as replied
    await this.dbService.updateTweet(tweet.id, { replied: true });
  }

  /**
   * Orchestrates the posting of approved replies to Twitter.
   * This method is designed to be called by scheduled tasks.
   * 
   * @returns Promise resolving to the number of replies posted
   */
  async postApprovedReplies(): Promise<number> {
    try {
      // Get approved but not posted replies
      const replies = await this.dbService.getReplies({ approved: true, posted: false });
      this.logger.log(`Found ${replies.length} approved replies to post`);

      let postedCount = 0;

      for (const reply of replies) {
        try {
          await this.postReply(reply);
          postedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to post reply ${reply.id}: ${error.message}`,
            error.stack,
          );
          // Continue with next reply even if one fails
        }
      }

      return postedCount;
    } catch (error) {
      this.logger.error('Failed to post approved replies', error.stack);
      throw error;
    }
  }

  /**
   * Posts a single approved reply to Twitter.
   * 
   * @param reply The reply to post
   * @throws Error if posting fails
   */
  private async postReply(reply: Reply): Promise<void> {
    this.logger.debug(`Posting reply ${reply.id} for tweet ${reply.tweet.id}`);

    try {
      // Post to Twitter
      await this.twitterService.replyToTweet(reply.tweet.id, reply.replyText);
      
      // Update reply status in database
      await this.dbService.updateReply(reply.id, { posted: true });
      
      this.logger.debug(`Successfully posted reply ${reply.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to post reply ${reply.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
} 