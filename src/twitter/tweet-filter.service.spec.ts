import { Test, TestingModule } from '@nestjs/testing';
import { TweetFilterService } from './tweet-filter.service';
import { DbService } from '../db/db.service';
import { Tweet } from '../db/entities/tweet.entity';

describe('TweetFilterService', () => {
  let service: TweetFilterService;
  let dbService: DbService;

  const mockDbService = {
    getAllTweetIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TweetFilterService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<TweetFilterService>(TweetFilterService);
    dbService = module.get<DbService>(DbService);
  });

  describe('createFilterChain', () => {
    it('should create a filter chain with initial tweets', () => {
      const tweets = [
        { id: '1', text: 'test tweet 1' },
        { id: '2', text: 'test tweet 2' },
      ];

      const result = service.createFilterChain(tweets);

      expect(result.tweets).toEqual(tweets);
      expect(result.stats.total).toBe(2);
      expect(result.stats.filtered).toBe(2);
      expect(result.stats.reason).toBe('Initial tweets');
    });
  });

  describe('filterProcessedTweets', () => {
    it('should filter out already processed tweets', async () => {
      const tweets = [
        { id: '1', text: 'test tweet 1' },
        { id: '2', text: 'test tweet 2' },
        { id: '3', text: 'test tweet 3' },
      ];

      mockDbService.getAllTweetIds.mockResolvedValue([
        { id: '1' },
        { id: '3' },
      ]);

      const initialChain = service.createFilterChain(tweets);
      const result = await service.filterProcessedTweets(initialChain);

      expect(result.tweets).toEqual([{ id: '2', text: 'test tweet 2' }]);
      expect(result.stats.total).toBe(3);
      expect(result.stats.filtered).toBe(1);
      expect(result.stats.reason).toBe('Filtered out processed tweets');
    });
  });

  describe('filterByEngagement', () => {
    it('should filter tweets based on engagement metrics', () => {
      const tweets = [
        { id: '1', text: 'test tweet 1', public_metrics: { like_count: 10, retweet_count: 5, reply_count: 2 } },
        { id: '2', text: 'test tweet 2', public_metrics: { like_count: 3, retweet_count: 1, reply_count: 0 } },
        { id: '3', text: 'test tweet 3', public_metrics: { like_count: 8, retweet_count: 3, reply_count: 1 } },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.filterByEngagement(initialChain, {
        minLikes: 5,
        minRetweets: 2,
        minReplies: 1,
      });

      expect(result.tweets).toEqual([
        { id: '1', text: 'test tweet 1', public_metrics: { like_count: 10, retweet_count: 5, reply_count: 2 } },
        { id: '3', text: 'test tweet 3', public_metrics: { like_count: 8, retweet_count: 3, reply_count: 1 } },
      ]);
      expect(result.stats.total).toBe(3);
      expect(result.stats.filtered).toBe(2);
      expect(result.stats.reason).toBe('Filtered by engagement metrics');
    });

    it('should return all tweets when no engagement criteria are specified', () => {
      const tweets = [
        { id: '1', text: 'test tweet 1', public_metrics: { like_count: 10 } },
        { id: '2', text: 'test tweet 2', public_metrics: { like_count: 3 } },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.filterByEngagement(initialChain, {});

      expect(result.tweets).toEqual(tweets);
      expect(result.stats.total).toBe(2);
      expect(result.stats.filtered).toBe(2);
    });
  });

  describe('filterByKeywords', () => {
    it('should filter tweets based on exclude keywords', () => {
      const tweets = [
        { id: '1', text: 'This is a spam tweet' },
        { id: '2', text: 'This is a normal tweet' },
        { id: '3', text: 'This is an ad tweet' },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.filterByKeywords(initialChain, {
        excludeKeywords: ['spam', 'ad'],
      });

      expect(result.tweets).toEqual([
        { id: '2', text: 'This is a normal tweet' },
      ]);
      expect(result.stats.total).toBe(3);
      expect(result.stats.filtered).toBe(1);
      expect(result.stats.reason).toBe('Filtered by keywords');
    });

    it('should filter tweets based on include keywords', () => {
      const tweets = [
        { id: '1', text: 'This is about technology' },
        { id: '2', text: 'This is about sports' },
        { id: '3', text: 'This is about AI and technology' },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.filterByKeywords(initialChain, {
        includeKeywords: ['technology', 'AI'],
      });

      expect(result.tweets).toEqual([
        { id: '1', text: 'This is about technology' },
        { id: '3', text: 'This is about AI and technology' },
      ]);
      expect(result.stats.total).toBe(3);
      expect(result.stats.filtered).toBe(2);
    });

    it('should apply both include and exclude keywords', () => {
      const tweets = [
        { id: '1', text: 'This is a spam about technology' },
        { id: '2', text: 'This is about technology' },
        { id: '3', text: 'This is about AI' },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.filterByKeywords(initialChain, {
        includeKeywords: ['technology', 'AI'],
        excludeKeywords: ['spam'],
      });

      expect(result.tweets).toEqual([
        { id: '2', text: 'This is about technology' },
        { id: '3', text: 'This is about AI' },
      ]);
      expect(result.stats.total).toBe(3);
      expect(result.stats.filtered).toBe(2);
    });
  });

  describe('filterByAge', () => {
    it('should filter tweets based on age', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

      const tweets = [
        { id: '1', text: 'recent tweet', created_at: now.toISOString() },
        { id: '2', text: 'one hour old', created_at: oneHourAgo.toISOString() },
        { id: '3', text: 'two hours old', created_at: twoHoursAgo.toISOString() },
        { id: '4', text: 'three hours old', created_at: threeHoursAgo.toISOString() },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.filterByAge(initialChain, 2); // 2 hours max age

      expect(result.tweets).toEqual([
        { id: '1', text: 'recent tweet', created_at: now.toISOString() },
        { id: '2', text: 'one hour old', created_at: oneHourAgo.toISOString() },
        { id: '3', text: 'two hours old', created_at: twoHoursAgo.toISOString() },
      ]);
      expect(result.stats.total).toBe(4);
      expect(result.stats.filtered).toBe(3);
      expect(result.stats.reason).toBe('Filtered by age');
    });

    it('should return all tweets when no max age is specified', () => {
      const tweets = [
        { id: '1', text: 'tweet 1', created_at: new Date().toISOString() },
        { id: '2', text: 'tweet 2', created_at: new Date().toISOString() },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.filterByAge(initialChain, 0);

      expect(result.tweets).toEqual(tweets);
      expect(result.stats.total).toBe(2);
      expect(result.stats.filtered).toBe(2);
    });
  });

  describe('sortByEngagement', () => {
    it('should sort tweets by engagement metrics', () => {
      const tweets = [
        { id: '1', text: 'low engagement', public_metrics: { like_count: 5, retweet_count: 2 } },
        { id: '2', text: 'high engagement', public_metrics: { like_count: 20, retweet_count: 10 } },
        { id: '3', text: 'medium engagement', public_metrics: { like_count: 10, retweet_count: 5 } },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.sortByEngagement(initialChain);

      expect(result.tweets).toEqual([
        { id: '2', text: 'high engagement', public_metrics: { like_count: 20, retweet_count: 10 } },
        { id: '3', text: 'medium engagement', public_metrics: { like_count: 10, retweet_count: 5 } },
        { id: '1', text: 'low engagement', public_metrics: { like_count: 5, retweet_count: 2 } },
      ]);
      expect(result.stats.total).toBe(3);
      expect(result.stats.filtered).toBe(3);
      expect(result.stats.reason).toBe('Sorted by engagement');
    });

    it('should handle tweets with missing metrics', () => {
      const tweets = [
        { id: '1', text: 'no metrics' },
        { id: '2', text: 'with metrics', public_metrics: { like_count: 10, retweet_count: 5 } },
      ];

      const initialChain = service.createFilterChain(tweets);
      const result = service.sortByEngagement(initialChain);

      expect(result.tweets).toEqual([
        { id: '2', text: 'with metrics', public_metrics: { like_count: 10, retweet_count: 5 } },
        { id: '1', text: 'no metrics' },
      ]);
    });
  });

  describe('getDefaultFilterOptions', () => {
    it('should return default filter options', () => {
      const options = service.getDefaultFilterOptions();

      expect(options).toEqual({
        minLikes: 5,
        minRetweets: 2,
        excludeKeywords: ['spam', 'ad', 'promotion'],
        maxAgeInHours: 24,
      });
    });
  });
}); 