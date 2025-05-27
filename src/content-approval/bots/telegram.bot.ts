import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { ApprovalMessage } from '../interfaces/approval-message.interface';
import { Tweet } from '../../db/entities/tweet.entity';
import { Reply } from '../../db/entities/reply.entity';

/**
 * Service responsible for handling all Telegram bot operations.
 * This service encapsulates all direct interactions with the Telegram Bot API,
 * providing a clean interface for sending messages, handling callbacks,
 * and managing the bot's lifecycle.
 * 
 * The service is designed to be used by approval strategies that need
 * Telegram integration, abstracting away the complexities of the Telegram API.
 */
@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: TelegramBot;
  private isInitialized = false;
  private editModeUsers = new Map<number, { tweetId: string; replyId: string }>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initializes the Telegram bot when the module starts.
   * Sets up the bot with the token from environment variables.
   * 
   * @throws Error if TELEGRAM_TOKEN is not set in environment variables
   */
  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_TOKEN environment variable is not set');
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.isInitialized = true;
    this.logger.log('Telegram bot initialized successfully');
  }

  private ensureInitialized() {
    if (!this.isInitialized || !this.bot) {
      throw new Error('Telegram bot is not initialized yet');
    }
  }

  /**
   * Sets up a callback handler for the bot.
   * This method allows the strategy to handle callback queries (button clicks)
   * from the Telegram interface.
   * 
   * @param handler Function to handle callback queries, receiving the parsed data
   * and the original message
   */
  setupCallbackHandler(handler: (data: ApprovalMessage, message: TelegramBot.Message) => Promise<void>) {
    this.ensureInitialized();
    this.bot.on('callback_query', async (callbackQuery) => {
      try {
        const data = this.parseCallbackData(callbackQuery.data);
        await handler(data, callbackQuery.message);
      } catch (error) {
        this.logger.error(`Error handling callback query: ${error.message}`, error.stack);
        await this.sendMessage(
          callbackQuery.message.chat.id,
          'Sorry, there was an error processing your request.',
        );
      }
    });

    // Set up message handler for edited text
    this.bot.on('message', async (message) => {
      const userId = message.from?.id;
      if (!userId || !message.text) return;

      const editData = this.editModeUsers.get(userId);
      if (editData) {
        try {
          await handler({
            action: 'edit',
            tweetId: editData.tweetId,
            replyId: editData.replyId,
            editedText: message.text,
          }, message);
          this.editModeUsers.delete(userId);
        } catch (error) {
          this.logger.error(`Error handling edited text: ${error.message}`, error.stack);
          await this.sendMessage(
            message.chat.id,
            'Sorry, there was an error processing your edited text.',
          );
        }
      }
    });

    this.logger.log('Callback and message handlers set up successfully');
  }

  private parseCallbackData(data: string): ApprovalMessage {
    try {
      // Format: action:tweetId:replyId
      const [action, tweetId, replyId] = data.split(':');
      if (!action || !tweetId || !replyId) {
        throw new Error('Invalid callback data format');
      }
      return {
        action,
        tweetId,
        replyId,
      };
    } catch (error) {
      this.logger.error(`Failed to parse callback data: ${data}`, error.stack);
      throw new Error('Invalid callback data format');
    }
  }

  private createCallbackData(action: string, tweetId: string, replyId: string): string {
    // Format: action:tweetId:replyId
    return `${action}:${tweetId}:${replyId}`;
  }

  /**
   * Sends a message to a specific chat.
   * 
   * @param chatId The chat ID to send the message to
   * @param text The message text to send
   * @param options Additional message options (parse mode, keyboard, etc.)
   * @returns Promise resolving to the sent message
   * @throws Error if message sending fails
   */
  async sendMessage(chatId: string | number, text: string, options?: TelegramBot.SendMessageOptions) {
    this.ensureInitialized();
    try {
      const message = await this.bot.sendMessage(chatId, text, options);
      this.logger.debug(`Message sent to chat ${chatId}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send message to chat ${chatId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Edits an existing message in a chat.
   * 
   * @param chatId The chat ID containing the message
   * @param messageId The ID of the message to edit
   * @param text The new text for the message
   * @param options Additional message options (parse mode, keyboard, etc.)
   * @returns Promise resolving to the edited message
   * @throws Error if message editing fails
   */
  async editMessage(chatId: string | number, messageId: number, text: string, options?: TelegramBot.EditMessageTextOptions) {
    this.ensureInitialized();
    try {
      const message = await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        ...options,
      });
      this.logger.debug(`Message ${messageId} edited in chat ${chatId}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to edit message ${messageId} in chat ${chatId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Creates an approval message with inline keyboard.
   * Formats the tweet and reply content into a readable message
   * and creates an interactive keyboard for approval actions.
   * 
   * @param tweet The tweet to be approved
   * @param reply The reply to be approved
   * @returns Object containing the formatted message and keyboard configuration
   */
  createApprovalMessage(tweet: Tweet, reply: Reply) {
    const message = this.formatApprovalMessage(tweet, reply);
    const keyboard = this.createApprovalKeyboard(tweet.id, reply.id);
    return { message, keyboard };
  }

  /**
   * Formats the approval message with tweet and reply content.
   * Uses HTML formatting for better readability.
   * 
   * @param tweet The tweet to be displayed
   * @param reply The reply to be displayed
   * @returns Formatted message string with HTML tags
   */
  private formatApprovalMessage(tweet: Tweet, reply: Reply): string {
    const tweetUrl = `https://twitter.com/${tweet.author}/status/${tweet.id}`;
    return `
📝 <b>New Reply for Approval</b>

Tweet by @${tweet.author}:
${tweet.content}
<a href="${tweetUrl}">🔗 View Tweet</a>

Generated Reply:
${reply.replyText}

<i>Click the buttons below to approve, reject, or edit the reply.</i>
    `.trim();
  }

  /**
   * Creates an inline keyboard for approval actions.
   * Generates a keyboard with buttons for approve, reject, and edit actions.
   * 
   * @param tweetId The ID of the tweet
   * @param replyId The ID of the reply
   * @returns Keyboard configuration object for Telegram
   */
  private createApprovalKeyboard(tweetId: string, replyId: string) {
    return {
      inline_keyboard: [
        [
          {
            text: '✅ Approve',
            callback_data: this.createCallbackData('approve', tweetId, replyId),
          },
          {
            text: '❌ Reject',
            callback_data: this.createCallbackData('reject', tweetId, replyId),
          },
        ],
        [
          {
            text: '✏️ Edit',
            callback_data: this.createCallbackData('edit', tweetId, replyId),
          },
        ],
      ],
    };
  }

  setEditMode(userId: number, tweetId: string, replyId: string) {
    this.editModeUsers.set(userId, { tweetId, replyId });
  }

  clearEditMode(userId: number) {
    this.editModeUsers.delete(userId);
  }
} 