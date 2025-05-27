import { Test, TestingModule } from '@nestjs/testing';
import { TwitterService } from './twitter.service';
import { TwitterApi } from 'twitter-api-v2';

// Create a mock for the TwitterApi class
const mockTwitterApi = {
  v2: {
    search: jest.fn(),
    reply: jest.fn(),
    tweet: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock the TwitterApi constructor
jest.mock('twitter-api-v2', () => ({
  TwitterApi: jest.fn().mockImplementation(() => mockTwitterApi),
}));

describe('TwitterService', () => {
  let service: TwitterService;

  const mockTwitterResponse = {
    data: [
      {
        id: '123',
        text: 'Test tweet',
        author_id: '456',
        created_at: '2024-03-20T12:00:00Z',
      },
    ],
    meta: {
      result_count: 1,
      newest_id: '123',
      oldest_id: '123',
    },
  };

  const mockTweetResponse = {
    data: {
      id: '789',
      text: 'Test tweet',
    },
  };

  beforeEach(async () => {
    process.env.TWITTER_BEARER = 'test-bearer-token';
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TwitterService],
    }).compile();

    service = module.get<TwitterService>(TwitterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if TWITTER_BEARER is not set', () => {
    delete process.env.TWITTER_BEARER;
    expect(() => new TwitterService()).toThrow('TWITTER_BEARER environment variable is not set');
  });

  describe('fetchTweetsByUser', () => {
    it('should fetch tweets from a specific user', async () => {
      mockTwitterApi.v2.search.mockResolvedValueOnce(mockTwitterResponse);

      const result = await service.fetchTweetsByUser('elonmusk');

      expect(mockTwitterApi.v2.search).toHaveBeenCalledWith(
        'from:elonmusk',
        expect.objectContaining({
          max_results: 10,
          'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
        }),
      );
      expect(result).toEqual(mockTwitterResponse);
    });

    it('should handle errors when fetching user tweets', async () => {
      const error = new Error('API Error');
      mockTwitterApi.v2.search.mockRejectedValueOnce(error);

      await expect(service.fetchTweetsByUser('elonmusk')).rejects.toThrow('Failed to fetch tweets: API Error');
    });
  });

  describe('fetchTweetsByHashtag', () => {
    it('should fetch tweets with a specific hashtag', async () => {
      mockTwitterApi.v2.search.mockResolvedValueOnce(mockTwitterResponse);

      const result = await service.fetchTweetsByHashtag('technology');

      expect(mockTwitterApi.v2.search).toHaveBeenCalledWith(
        '#technology',
        expect.objectContaining({
          max_results: 10,
          'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
        }),
      );
      expect(result).toEqual(mockTwitterResponse);
    });

    it('should handle errors when fetching hashtag tweets', async () => {
      const error = new Error('API Error');
      mockTwitterApi.v2.search.mockRejectedValueOnce(error);

      await expect(service.fetchTweetsByHashtag('technology')).rejects.toThrow('Failed to fetch tweets: API Error');
    });
  });

  describe('fetchTweetsByQuery', () => {
    it('should fetch tweets with a custom query', async () => {
      mockTwitterApi.v2.search.mockResolvedValueOnce(mockTwitterResponse);

      const result = await service.fetchTweetsByQuery('AI news');

      expect(mockTwitterApi.v2.search).toHaveBeenCalledWith(
        'AI news',
        expect.objectContaining({
          max_results: 10,
          'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
        }),
      );
      expect(result).toEqual(mockTwitterResponse);
    });

    it('should handle errors when fetching query tweets', async () => {
      const error = new Error('API Error');
      mockTwitterApi.v2.search.mockRejectedValueOnce(error);

      await expect(service.fetchTweetsByQuery('AI news')).rejects.toThrow('Failed to fetch tweets: API Error');
    });
  });

  describe('fetchTrendingTweets', () => {
    it('should fetch trending tweets', async () => {
      mockTwitterApi.v2.search.mockResolvedValueOnce(mockTwitterResponse);

      const result = await service.fetchTrendingTweets();

      expect(mockTwitterApi.v2.search).toHaveBeenCalledWith(
        'is:verified -is:retweet -is:reply',
        expect.objectContaining({
          max_results: 10,
          sort_order: 'relevancy',
          'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
        }),
      );
      expect(result).toEqual(mockTwitterResponse);
    });

    it('should handle errors when fetching trending tweets', async () => {
      const error = new Error('API Error');
      mockTwitterApi.v2.search.mockRejectedValueOnce(error);

      await expect(service.fetchTrendingTweets()).rejects.toThrow('Failed to fetch trending tweets: API Error');
    });
  });

  describe('query options', () => {
    it('should apply maxResults option', async () => {
      mockTwitterApi.v2.search.mockResolvedValueOnce(mockTwitterResponse);

      await service.fetchTweetsByQuery('test', { maxResults: 50 });

      expect(mockTwitterApi.v2.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          max_results: 50,
        }),
      );
    });

    it('should apply date range options', async () => {
      const startTime = new Date('2024-03-19');
      const endTime = new Date('2024-03-20');
      mockTwitterApi.v2.search.mockResolvedValueOnce(mockTwitterResponse);

      await service.fetchTweetsByQuery('test', { startTime, endTime });

      expect(mockTwitterApi.v2.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        }),
      );
    });

    it('should apply sort order option', async () => {
      mockTwitterApi.v2.search.mockResolvedValueOnce(mockTwitterResponse);

      await service.fetchTweetsByQuery('test', { sortOrder: 'recency' });

      expect(mockTwitterApi.v2.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          sort_order: 'recency',
        }),
      );
    });
  });

  describe('replyToTweet', () => {
    it('should reply to a tweet', async () => {
      const tweetId = '123';
      const replyText = 'Test reply';
      mockTwitterApi.v2.reply.mockResolvedValueOnce(mockTweetResponse);

      const result = await service.replyToTweet(tweetId, replyText);

      expect(mockTwitterApi.v2.reply).toHaveBeenCalledWith(replyText, tweetId);
      expect(result).toEqual(mockTweetResponse);
    });

    it('should handle errors when replying to a tweet', async () => {
      const error = new Error('API Error');
      mockTwitterApi.v2.reply.mockRejectedValueOnce(error);

      await expect(service.replyToTweet('123', 'Test reply')).rejects.toThrow('Failed to reply to tweet: API Error');
    });
  });

  describe('postTweet', () => {
    it('should post a new tweet', async () => {
      const tweetText = 'Test tweet';
      mockTwitterApi.v2.tweet.mockResolvedValueOnce(mockTweetResponse);

      const result = await service.postTweet(tweetText);

      expect(mockTwitterApi.v2.tweet).toHaveBeenCalledWith(tweetText);
      expect(result).toEqual(mockTweetResponse);
    });

    it('should handle errors when posting a tweet', async () => {
      const error = new Error('API Error');
      mockTwitterApi.v2.tweet.mockRejectedValueOnce(error);

      await expect(service.postTweet('Test tweet')).rejects.toThrow('Failed to post tweet: API Error');
    });
  });

  describe('deleteTweet', () => {
    it('should delete a tweet', async () => {
      const tweetId = '123';
      mockTwitterApi.v2.delete.mockResolvedValueOnce(undefined);

      await service.deleteTweet(tweetId);

      expect(mockTwitterApi.v2.delete).toHaveBeenCalledWith(tweetId);
    });

    it('should handle errors when deleting a tweet', async () => {
      const error = new Error('API Error');
      mockTwitterApi.v2.delete.mockRejectedValueOnce(error);

      await expect(service.deleteTweet('123')).rejects.toThrow('Failed to delete tweet: API Error');
    });
  });
});
