import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ContentGeneratorService } from './content-generator.service';
import OpenAI from 'openai';

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('ContentGeneratorService', () => {
  let service: ContentGeneratorService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  const mockTweetContext = {
    id: '123',
    text: 'This is a test tweet',
    author: 'testuser',
    createdAt: new Date(),
  };

  const mockOpenAIResponse = {
    choices: [
      {
        message: {
          content: 'This is a generated reply',
        },
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentGeneratorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ContentGeneratorService>(ContentGeneratorService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if OPENAI_API_KEY is not set', () => {
    mockConfigService.get.mockReturnValueOnce(null);
    expect(() => new ContentGeneratorService(mockConfigService as any)).toThrow(
      'OPENAI_API_KEY environment variable is not set',
    );
  });

  describe('generateReply', () => {
    it('should generate a reply with default professional tone', async () => {
      mockCreate.mockResolvedValueOnce(mockOpenAIResponse);

      const result = await service.generateReply(mockTweetContext);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('professional'),
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(mockTweetContext.text),
            }),
          ]),
          max_tokens: expect.any(Number),
          temperature: 0.7,
        }),
      );

      expect(result).toEqual({
        content: 'This is a generated reply',
        metadata: {
          model: expect.any(String),
          timestamp: expect.any(Date),
          promptTokens: 100,
          completionTokens: 50,
        },
      });
    });

    it('should generate a reply with specified tone', async () => {
      mockCreate.mockResolvedValueOnce(mockOpenAIResponse);

      await service.generateReply(mockTweetContext, ['friendly']);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('friendly'),
            }),
          ]),
        }),
      );
    });

    it('should handle empty response from OpenAI', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '' } }],
        usage: { prompt_tokens: 0, completion_tokens: 0 },
      });

      await expect(service.generateReply(mockTweetContext)).rejects.toThrow('No reply generated');
    });

    it('should handle OpenAI API errors', async () => {
      const error = new Error('API Error');
      mockCreate.mockRejectedValueOnce(error);

      await expect(service.generateReply(mockTweetContext)).rejects.toThrow(
        'Failed to generate reply: API Error',
      );
    });

    it('should include tweet context in the prompt', async () => {
      mockCreate.mockResolvedValueOnce(mockOpenAIResponse);

      await service.generateReply(mockTweetContext);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(`@${mockTweetContext.author}`),
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(mockTweetContext.text),
            }),
          ]),
        }),
      );
    });
  });
});
