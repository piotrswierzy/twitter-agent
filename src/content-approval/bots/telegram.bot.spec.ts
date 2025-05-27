import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { TelegramBotService } from './telegram.bot';
import { ApprovalMessage } from '../interfaces/approval-message.interface';
import { Tweet } from '../../db/entities/tweet.entity';
import { Reply } from '../../db/entities/reply.entity';

jest.mock('node-telegram-bot-api');

describe('TelegramBotService', () => {
  let service: TelegramBotService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockBot: jest.Mocked<TelegramBot>;

  const mockToken = 'test-token';
  const mockChatId = '123456';
  const mockMessageId = 789;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue(mockToken),
    } as any;

    mockBot = {
      on: jest.fn(),
      sendMessage: jest.fn(),
      editMessageText: jest.fn(),
    } as any;

    (TelegramBot as jest.Mock).mockImplementation(() => mockBot);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramBotService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TelegramBotService>(TelegramBotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize the bot with the token from config', async () => {
      await service.onModuleInit();
      expect(TelegramBot).toHaveBeenCalledWith(mockToken, { polling: true });
    });

    it('should throw an error if token is not set', async () => {
      mockConfigService.get.mockReturnValue(null);
      await expect(service.onModuleInit()).rejects.toThrow('TELEGRAM_TOKEN environment variable is not set');
    });
  });

  describe('setupCallbackHandler', () => {
    it('should set up callback handler for the bot', async () => {
      const mockHandler = jest.fn();
      const mockCallbackQuery = {
        data: JSON.stringify({ action: 'approve', tweetId: '1', replyId: '2' }),
        message: { chat: { id: mockChatId } },
      };

      service.setupCallbackHandler(mockHandler);
      expect(mockBot.on).toHaveBeenCalledWith('callback_query', expect.any(Function));

      // Simulate callback
      const callbackHandler = mockBot.on.mock.calls[0][1];
      await callbackHandler(mockCallbackQuery);

      expect(mockHandler).toHaveBeenCalledWith(
        { action: 'approve', tweetId: '1', replyId: '2' },
        mockCallbackQuery.message,
      );
    });

    it('should handle invalid callback data', async () => {
      const mockHandler = jest.fn();
      const mockCallbackQuery = {
        data: 'invalid-json',
        message: { chat: { id: mockChatId } },
      };

      mockBot.sendMessage.mockResolvedValue({} as any);

      service.setupCallbackHandler(mockHandler);
      const callbackHandler = mockBot.on.mock.calls[0][1];
      await callbackHandler(mockCallbackQuery);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockChatId,
        'Sorry, there was an error processing your request.',
      );
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const mockMessage = { message_id: mockMessageId };
      mockBot.sendMessage.mockResolvedValue(mockMessage as any);

      const result = await service.sendMessage(mockChatId, 'test message');
      expect(result).toBe(mockMessage);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(mockChatId, 'test message', undefined);
    });

    it('should handle send message errors', async () => {
      const error = new Error('Send failed');
      mockBot.sendMessage.mockRejectedValue(error);

      await expect(service.sendMessage(mockChatId, 'test message')).rejects.toThrow('Send failed');
    });
  });

  describe('editMessage', () => {
    it('should edit a message successfully', async () => {
      const mockMessage = { message_id: mockMessageId };
      mockBot.editMessageText.mockResolvedValue(mockMessage as any);

      const result = await service.editMessage(mockChatId, mockMessageId, 'edited message');
      expect(result).toBe(mockMessage);
      expect(mockBot.editMessageText).toHaveBeenCalledWith('edited message', {
        chat_id: mockChatId,
        message_id: mockMessageId,
      });
    });

    it('should handle edit message errors', async () => {
      const error = new Error('Edit failed');
      mockBot.editMessageText.mockRejectedValue(error);

      await expect(service.editMessage(mockChatId, mockMessageId, 'edited message')).rejects.toThrow('Edit failed');
    });
  });

  describe('createApprovalMessage', () => {
    const mockTweet: Tweet = {
      id: '1',
      author: 'testuser',
      content: 'Test tweet content',
      timestamp: new Date(),
      source: 'user',
      replied: false,
      approved: false,
      posted: false,
    } as Tweet;

    const mockReply: Reply = {
      id: '2',
      replyText: 'Test reply content',
      approved: false,
      posted: false,
      createdAt: new Date(),
    } as Reply;

    it('should create approval message with keyboard', () => {
      const { message, keyboard } = service.createApprovalMessage(mockTweet, mockReply);

      expect(message).toContain(mockTweet.content);
      expect(message).toContain(mockReply.replyText);
      expect(keyboard.inline_keyboard).toHaveLength(2);
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[1]).toHaveLength(1);
    });

    it('should include correct callback data in keyboard buttons', () => {
      const { keyboard } = service.createApprovalMessage(mockTweet, mockReply);

      const approveButton = keyboard.inline_keyboard[0][0];
      const approveData = JSON.parse(approveButton.callback_data) as ApprovalMessage;
      expect(approveData).toEqual({
        action: 'approve',
        tweetId: mockTweet.id,
        replyId: mockReply.id,
      });

      const rejectButton = keyboard.inline_keyboard[0][1];
      const rejectData = JSON.parse(rejectButton.callback_data) as ApprovalMessage;
      expect(rejectData).toEqual({
        action: 'reject',
        tweetId: mockTweet.id,
        replyId: mockReply.id,
      });

      const editButton = keyboard.inline_keyboard[1][0];
      const editData = JSON.parse(editButton.callback_data) as ApprovalMessage;
      expect(editData).toEqual({
        action: 'edit',
        tweetId: mockTweet.id,
        replyId: mockReply.id,
      });
    });
  });
}); 