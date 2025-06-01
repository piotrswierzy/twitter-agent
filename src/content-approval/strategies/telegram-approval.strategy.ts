import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../../db/db.service';
import { TwitterService } from '../../twitter/twitter.service';
import { ApprovalStrategy } from '../interfaces/approval-strategy.interface';
import { Tweet } from '../../db/entities/tweet.entity';
import { Reply } from '../../db/entities/reply.entity';
import { TelegramBotService } from '../bots/telegram.bot';
import TelegramBot from 'node-telegram-bot-api';
import { ApprovalMessage } from '../interfaces/approval-message.interface';
import { PostingSchedulerService } from '../../tasks/posting-scheduler.service';

/**
 * Telegram-specific implementation of the approval strategy.
 * Handles sending and managing approvals through a Telegram bot.
 */
@Injectable()
export class TelegramApprovalStrategy implements ApprovalStrategy, OnModuleInit {
  private readonly logger = new Logger(TelegramApprovalStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dbService: DbService,
    private readonly twitterService: TwitterService,
    private readonly telegramBot: TelegramBotService,
    private readonly postingScheduler: PostingSchedulerService,
  ) {}

  async onModuleInit() {
    // Wait for a short time to ensure the bot is initialized
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.telegramBot.setupCallbackHandler(this.handleCallbackQuery.bind(this));
  }

  async sendForApproval(tweet: Tweet, reply: Reply): Promise<void> {
    try {
      const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
      if (!chatId) {
        throw new Error('TELEGRAM_CHAT_ID environment variable is not set');
      }

      const { message, keyboard } = this.telegramBot.createApprovalMessage(tweet, reply);
      await this.telegramBot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });

      this.logger.log(`Sent approval request for tweet ${tweet.id}`);
    } catch (error) {
      this.logger.error(`Failed to send approval request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async handleApprove(tweetId: string, replyId: string): Promise<Date> {
    const reply = await this.dbService.getReplyById(replyId);
    if (!reply) {
      throw new Error(`Reply ${replyId} not found`);
    }

    // Schedule the reply using PostingSchedulerService
    const scheduledTime = await this.postingScheduler.scheduleReply(reply);
    await this.dbService.updateReply(replyId, { approved: true });    
    
    this.logger.log(`Reply ${replyId} approved for tweet ${tweetId}, scheduled for ${scheduledTime}`);
    return scheduledTime;
  }

  async handleReject(tweetId: string, replyId: string): Promise<void> {
    const reply = await this.dbService.getReplyById(replyId);
    if (!reply) {
      throw new Error(`Reply ${replyId} not found`);
    }

    // Update reply status
    await this.dbService.updateReply(replyId, { approved: false });
  }

  async handleEdit(tweetId: string, replyId: string, editedText: string): Promise<void> {
    const reply = await this.dbService.getReplyById(replyId);
    if (!reply) {
      throw new Error(`Reply ${replyId} not found`);
    }

    // Update reply text
    await this.dbService.updateReply(replyId, { replyText: editedText });

    // Get updated tweet and reply for the new approval message
    const tweet = await this.dbService.getTweetById(tweetId);
    const updatedReply = await this.dbService.getReplyById(replyId);
    const { message, keyboard } = this.telegramBot.createApprovalMessage(tweet, updatedReply);

    // Send new approval message
    await this.telegramBot.sendMessage(
      this.configService.get<string>('TELEGRAM_CHAT_ID'),
      message,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      },
    );
  }

  private async handleCallbackQuery(
    data: ApprovalMessage,
    message: TelegramBot.Message,
  ): Promise<void> {
    const { tweetId, replyId, action, editedText } = data;

    try {
      this.logger.debug(`Handling callback query: action=${action}, tweetId=${tweetId}, replyId=${replyId}`);

      switch (action) {
        case 'approve':
          const scheduledTime = await this.handleApprove(tweetId, replyId);
          await this.telegramBot.editMessage(
            message.chat.id,
            message.message_id,
            `✅ Reply approved! It will be posted at ${scheduledTime.toLocaleString()}.`,
            { 
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [] }
            }
          );
          break;
        case 'reject':
          await this.handleReject(tweetId, replyId);
          await this.telegramBot.editMessage(
            message.chat.id,
            message.message_id,
            '❌ Reply rejected.',
            { 
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [] }
            }
          );
          break;
        case 'edit':
          if (editedText) {
            await this.handleEdit(tweetId, replyId, editedText);
            await this.telegramBot.editMessage(
              message.chat.id,
              message.message_id,
              '✏️ Reply updated! A new approval message has been sent.',
              { parse_mode: 'HTML' }
            );
          } else {
            const userId = message.from?.id;
            if (!userId) {
              throw new Error('Could not determine user ID');
            }
            this.telegramBot.setEditMode(userId, tweetId, replyId);
            await this.telegramBot.editMessage(
              message.chat.id,
              message.message_id,
              '✏️ Please send your edited reply text as a new message.',
              { parse_mode: 'HTML' }
            );
          }
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling callback query: ${error.message}`,
        error.stack,
        { action, tweetId, replyId }
      );
      await this.telegramBot.sendMessage(
        message.chat.id,
        `Sorry, there was an error processing your request: ${error.message}`,
        { parse_mode: 'HTML' }
      );
    }
  }
} 