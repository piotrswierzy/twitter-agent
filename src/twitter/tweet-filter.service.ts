import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { Tweet } from '../db/entities/tweet.entity';

interface TweetFilterOptions {
  minLikes?: number;
  minRetweets?: number;
  minReplies?: number;
  excludeKeywords?: string[];
  includeKeywords?: string[];
  maxAgeInHours?: number;
}

interface FilterResult {
  tweets: any[];
  stats: {
    total: number;
    filtered: number;
    reason: string;
  };
}

/**
 * Service responsible for filtering and prioritizing tweets for processing.
 * This service helps determine which tweets should be processed based on various criteria
 * such as engagement metrics, content relevance, and processing status.
 */
@Injectable()
export class TweetFilterService {
  private readonly logger = new Logger(TweetFilterService.name);

  constructor(private readonly dbService: DbService) {}

  /**
   * Creates a new filter chain starting with the given tweets.
   * 
   * @param tweets Initial array of tweets to filter
   * @returns FilterResult with initial tweets
   */
  createFilterChain(tweets: any[]): FilterResult {
    return {
      tweets,
      stats: {
        total: tweets.length,
        filtered: tweets.length,
        reason: 'Initial tweets'
      }
    };
  }

  /**
   * Filters out tweets that have already been processed.
   * 
   * @param result Current filter result
   * @returns Updated filter result
   */
  async filterProcessedTweets(result: FilterResult): Promise<FilterResult> {
    const processedTweetIds = new Set(
      (await this.dbService.getAllTweetIds()).map(tweet => tweet.id)
    );
    
    const filteredTweets = result.tweets.filter(tweet => !processedTweetIds.has(tweet.id));
    
    return {
      tweets: filteredTweets,
      stats: {
        total: result.stats.total,
        filtered: filteredTweets.length,
        reason: 'Filtered out processed tweets'
      }
    };
  }

  /**
   * Filters tweets based on engagement metrics.
   * 
   * @param result Current filter result
   * @param options Engagement filter options
   * @returns Updated filter result
   */
  filterByEngagement(result: FilterResult, options: TweetFilterOptions): FilterResult {
    if (!options.minLikes && !options.minRetweets && !options.minReplies) {
      return result;
    }

    const filteredTweets = result.tweets.filter(tweet => {
      const metrics = tweet.public_metrics || {};
      return (
        (!options.minLikes || metrics.like_count >= options.minLikes) &&
        (!options.minRetweets || metrics.retweet_count >= options.minRetweets) &&
        (!options.minReplies || metrics.reply_count >= options.minReplies)
      );
    });

    return {
      tweets: filteredTweets,
      stats: {
        total: result.stats.total,
        filtered: filteredTweets.length,
        reason: 'Filtered by engagement metrics'
      }
    };
  }

  /**
   * Filters tweets based on keywords.
   * 
   * @param result Current filter result
   * @param options Keyword filter options
   * @returns Updated filter result
   */
  filterByKeywords(result: FilterResult, options: TweetFilterOptions): FilterResult {
    let filteredTweets = result.tweets;

    if (options.excludeKeywords?.length) {
      filteredTweets = filteredTweets.filter(tweet => 
        !options.excludeKeywords.some(keyword => 
          tweet.text.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    if (options.includeKeywords?.length) {
      filteredTweets = filteredTweets.filter(tweet => 
        options.includeKeywords.some(keyword => 
          tweet.text.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    return {
      tweets: filteredTweets,
      stats: {
        total: result.stats.total,
        filtered: filteredTweets.length,
        reason: 'Filtered by keywords'
      }
    };
  }

  /**
   * Filters tweets based on age.
   * 
   * @param result Current filter result
   * @param maxAgeInHours Maximum age in hours
   * @returns Updated filter result
   */
  filterByAge(result: FilterResult, maxAgeInHours: number): FilterResult {
    if (!maxAgeInHours) {
      return result;
    }

    const maxAge = maxAgeInHours * 60 * 60 * 1000; // convert to milliseconds
    const now = Date.now();
    
    const filteredTweets = result.tweets.filter(tweet => {
      const tweetDate = new Date(tweet.created_at).getTime();
      return (now - tweetDate) <= maxAge;
    });

    return {
      tweets: filteredTweets,
      stats: {
        total: result.stats.total,
        filtered: filteredTweets.length,
        reason: 'Filtered by age'
      }
    };
  }

  /**
   * Sorts tweets by engagement metrics.
   * 
   * @param result Current filter result
   * @returns Updated filter result with sorted tweets
   */
  sortByEngagement(result: FilterResult): FilterResult {
    const sortedTweets = [...result.tweets].sort((a, b) => {
      const aMetrics = a.public_metrics || {};
      const bMetrics = b.public_metrics || {};
      const aEngagement = (aMetrics.like_count || 0) + (aMetrics.retweet_count || 0);
      const bEngagement = (bMetrics.like_count || 0) + (bMetrics.retweet_count || 0);
      return bEngagement - aEngagement;
    });

    return {
      tweets: sortedTweets,
      stats: {
        total: result.stats.total,
        filtered: result.stats.filtered,
        reason: 'Sorted by engagement'
      }
    };
  }
  /**
   * Gets the default filter options based on configuration.
   * These can be overridden when calling filterTweets.
   * 
   * @returns Default filter options
   */
  getDefaultFilterOptions(): TweetFilterOptions {
    return {
      minLikes: 5,
      minRetweets: 2,
      excludeKeywords: ['spam', 'ad', 'promotion'],
      maxAgeInHours: 24,
    };
  }
} 