import { Injectable, Logger } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import { ConfigService } from '@nestjs/config';

/**
 * Interface representing the Twitter API response structure
 */
interface TwitterResponse {
  data: Tweet[];
  meta: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
    next_token?: string;
  };
}

/**
 * Interface representing a Twitter tweet
 */
interface Tweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

/**
 * Interface for Twitter query options
 */
interface TwitterQueryOptions {
  /** Maximum number of results to return */
  maxResults?: number;
  /** Start time for the search range */
  startTime?: Date;
  /** End time for the search range */
  endTime?: Date;
  /** Token for pagination */
  nextToken?: string;
  /** Sort order for results */
  sortOrder?: 'recency' | 'relevancy';
}

/**
 * Service for interacting with the Twitter API v2
 * Handles tweet fetching, posting, replying, and deletion
 */
@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);
  private readonly client: TwitterApi;

  /**
   * Creates an instance of TwitterService
   * @throws {Error} If required environment variables are not set
   */
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('TWITTER_API_KEY');
    const apiSecret = this.configService.get<string>('TWITTER_API_SECRET');
    const accessToken = this.configService.get<string>('TWITTER_ACCESS_TOKEN');
    const accessSecret = this.configService.get<string>('TWITTER_ACCESS_SECRET');

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error('Twitter API credentials are not properly configured');
    }

    // Initialize with OAuth 1.0a user context
    this.client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    // Verify credentials on startup
    this.verifyCredentials();
  }

  /**
   * Verifies Twitter API credentials
   * @throws {Error} If credentials are invalid
   */
  private async verifyCredentials(): Promise<void> {
    try {
      await this.client.v2.me();
      this.logger.log('Successfully verified Twitter API credentials');
    } catch (error) {
      this.logger.error('Failed to verify Twitter API credentials:', error);
      throw new Error('Invalid Twitter API credentials');
    }
  }

  /**
   * Formats a Date object to ISO string format
   * @param date - The date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Builds query parameters for Twitter API requests
   * @param query - The search query
   * @param options - Optional parameters for the query
   * @returns Object containing formatted query parameters
   */
  private buildQueryParams(query: string, options: TwitterQueryOptions = {}) {
    const params: Record<string, string> = {
      query,
      'tweet.fields': 'created_at,author_id,public_metrics',
      max_results: options.maxResults?.toString() || '10',
    };

    if (options.startTime) {
      params.start_time = this.formatDate(options.startTime);
    }
    if (options.endTime) {
      params.end_time = this.formatDate(options.endTime);
    }
    if (options.nextToken) {
      params.pagination_token = options.nextToken;
    }
    if (options.sortOrder) {
      params.sort_order = options.sortOrder;
    }

    return params;
  }

  /**
   * Fetches tweets from a specific user
   * @param username - The Twitter username to fetch tweets from
   * @param options - Optional parameters for the query
   * @returns Promise containing the tweets
   * @throws {Error} If the API request fails
   */
  async fetchTweetsByUser(username: string, options: TwitterQueryOptions = {}): Promise<TwitterResponse> {
    try {
      const tweets = await this.client.v2.search(`from:${username}`, {
        max_results: options.maxResults || 10,
        start_time: options.startTime?.toISOString(),
        end_time: options.endTime?.toISOString(),
        next_token: options.nextToken,
        sort_order: options.sortOrder,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
      });

      return {
        data: tweets.data.data || [],
        meta: tweets.data.meta || {
          result_count: 0,
          newest_id: '',
          oldest_id: '',
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tweets for user ${username}:`, error);
      throw new Error(`Failed to fetch tweets: ${error.message}`);
    }
  }

  /**
   * Fetches tweets containing a specific hashtag
   * @param hashtag - The hashtag to search for (without the # symbol)
   * @param options - Optional parameters for the query
   * @returns Promise containing the tweets
   * @throws {Error} If the API request fails
   */
  async fetchTweetsByHashtag(hashtag: string, options: TwitterQueryOptions = {}): Promise<TwitterResponse> {
    try {
      const tweets = await this.client.v2.search(`#${hashtag}`, {
        max_results: options.maxResults || 10,
        start_time: options.startTime?.toISOString(),
        end_time: options.endTime?.toISOString(),
        next_token: options.nextToken,
        sort_order: options.sortOrder,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
      });

      return {
        data: tweets.data.data || [],
        meta: tweets.data.meta || {
          result_count: 0,
          newest_id: '',
          oldest_id: '',
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tweets for hashtag #${hashtag}:`, error);
      throw new Error(`Failed to fetch tweets: ${error.message}`);
    }
  }

  /**
   * Fetches tweets matching a custom search query
   * @param query - The search query
   * @param options - Optional parameters for the query
   * @returns Promise containing the tweets
   * @throws {Error} If the API request fails
   */
  async fetchTweetsByQuery(query: string, options: TwitterQueryOptions = {}): Promise<TwitterResponse> {
    try {
      const tweets = await this.client.v2.search(query, {
        max_results: options.maxResults || 10,
        start_time: options.startTime?.toISOString(),
        end_time: options.endTime?.toISOString(),
        next_token: options.nextToken,
        sort_order: options.sortOrder,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
      });

      return {
        data: tweets.data.data || [],
        meta: tweets.data.meta || {
          result_count: 0,
          newest_id: '',
          oldest_id: '',
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tweets for query "${query}":`, error);
      throw new Error(`Failed to fetch tweets: ${error.message}`);
    }
  }

  /**
   * Fetches trending tweets from verified accounts
   * @param options - Optional parameters for the query
   * @returns Promise containing the tweets
   * @throws {Error} If the API request fails
   */
  async fetchTrendingTweets(options: TwitterQueryOptions = {}): Promise<TwitterResponse> {
    try {
      const tweets = await this.client.v2.search('is:verified -is:retweet -is:reply', {
        max_results: options.maxResults || 10,
        start_time: options.startTime?.toISOString(),
        end_time: options.endTime?.toISOString(),
        next_token: options.nextToken,
        sort_order: 'relevancy',
        'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
      });

      return {
        data: tweets.data.data || [],
        meta: tweets.data.meta || {
          result_count: 0,
          newest_id: '',
          oldest_id: '',
        },
      };
    } catch (error) {
      this.logger.error('Error fetching trending tweets:', error);
      throw new Error(`Failed to fetch trending tweets: ${error.message}`);
    }
  }

  /**
   * Replies to a specific tweet
   * @param tweetId - The ID of the tweet to reply to
   * @param replyText - The text content of the reply
   * @returns Promise containing the created reply tweet
   * @throws {Error} If the API request fails
   */
  async replyToTweet(tweetId: string, replyText: string): Promise<any> {
    try {
      const reply = await this.client.v2.reply(replyText, tweetId);
      this.logger.log(`Successfully replied to tweet ${tweetId}`);
      return reply;
    } catch (error) {
      this.logger.error(`Error replying to tweet ${tweetId}:`, error);
      throw new Error(`Failed to reply to tweet: ${error.message}`);
    }
  }

  /**
   * Posts a new tweet
   * @param text - The text content of the tweet
   * @returns Promise containing the created tweet
   * @throws {Error} If the API request fails
   */
  async postTweet(text: string): Promise<any> {
    try {
      const tweet = await this.client.v2.tweet(text);
      this.logger.log('Successfully posted new tweet');
      return tweet;
    } catch (error) {
      this.logger.error('Error posting tweet:', error);
      throw new Error(`Failed to post tweet: ${error.message}`);
    }
  }

  /**
   * Deletes a tweet
   * @param tweetId - The ID of the tweet to delete
   * @throws {Error} If the API request fails
   */
  async deleteTweet(tweetId: string): Promise<void> {
    try {
      await this.client.v2.delete(tweetId);
      this.logger.log(`Successfully deleted tweet ${tweetId}`);
    } catch (error) {
      this.logger.error(`Error deleting tweet ${tweetId}:`, error);
      throw new Error(`Failed to delete tweet: ${error.message}`);
    }
  }
}
