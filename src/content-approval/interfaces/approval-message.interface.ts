export interface ApprovalMessage {
  tweetId: string;
  replyId: string;
  action: string;
  editedText?: string;
}

export interface TelegramMessage {
  messageId: number;
  chatId: number;
  text: string;
  replyMarkup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data: string;
    }>>;
  };
} 