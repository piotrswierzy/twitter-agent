import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as prompts from '../config/prompts.json';

/**
 * Interface for tweet context used in reply generation
 */
interface TweetContext {
  id: string;
  text: string;
  author: string;
  created_at?: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
  conversation?: {
    id: string;
    text: string;
    author: string;
    created_at?: string;
  }[];
  referenced_tweets?: {
    type: 'replied_to' | 'quoted' | 'retweeted';
    id: string;
    text: string;
    author: string;
  }[];
}

/**
 * Interface for the generated reply
 */
interface GeneratedReply {
  content: string;
  metadata: {
    model: string;
    timestamp: Date;
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Service responsible for generating AI-powered replies to tweets
 */
@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly maxLength: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.openai = new OpenAI({ apiKey });
    this.model = prompts.model;
    this.maxLength = prompts.maxLength;
  }
/**
 * Builds the system prompt using the structured configuration
 * @param tone - Array of desired tones for the reply
 * @returns Formatted system prompt string
 */
private buildSystemPrompt(tone: (keyof typeof prompts.tone)[]): string {
  const toneInstructions = tone.map(t => prompts.tone[t]).join('\n');

  return `${prompts.systemPrompt}

Tone Instructions:
${toneInstructions}

Your Identity:
${prompts.bio.join('\n')}

Your Personality Traits:
${prompts.personalityTraits.join('\n')}

Your Expertise:
${prompts.topics.join('\n')}

Example Tweets You Write:
${prompts.exampleTweets.map(ex => `
[${ex.category}]
${ex.content}
`).join('\n')}

Example Conversations (How You Reply):
${prompts.messageExamples.map(ex => `
Tweet: ${ex.tweet}
Your Reply: ${ex.reply}
`).join('\n')}

Key Guidelines:
1. Keep replies short under ${this.maxLength} characters
2. Use only standard keyboard characters. No special symbols or formatting
3. Be blunt and grounded. Say what you mean
4. No fluff, no vague takes, no poetic nonsense
5. Focus on clarity, not style
6. Use dry humor only if it sharpens the point
7. Skip intros. Just say the thing
8. Call out weak logic or buzzwords, calmly
9. Match the tweet’s tone, but cut through noise
10. Most replies should be 1–2 short lines. 3 max

Formatting Rules:
- No emojis
- No exclamation marks
- No metaphors, quotes, or motivational language
- Don’t start with “hey” or “I think”, get to it

Final Note:
Don’t try to sound smart. Don’t try to sound nice. This isn’t marketing.
Be clear. Be dry. Be real. Say less. Mean it more. `;
}

/**
 * Builds the user prompt for the specific tweet
 * @param tweetContext - The context of the tweet to reply to
 * @returns Formatted user prompt string
 */
private buildUserPrompt(tweetContext: TweetContext): string {
  const timestamp = tweetContext.created_at
    ? `Posted: ${new Date(tweetContext.created_at).toLocaleString()}`
    : '';

  const engagement = tweetContext.public_metrics
    ? `
Engagement:
- Likes: ${tweetContext.public_metrics.like_count}
- Retweets: ${tweetContext.public_metrics.retweet_count}
- Replies: ${tweetContext.public_metrics.reply_count}
- Quotes: ${tweetContext.public_metrics.quote_count}`
    : '';

  let context = '';
  
  // Build thread context in chronological order
  if (tweetContext.referenced_tweets?.length || tweetContext.conversation?.length) {
    context += '\nThread Context:\n';
    
    // First, add referenced tweets (quotes, replies) if available
    if (tweetContext.referenced_tweets?.length) {
      // Sort referenced tweets by type to show replies first, then quotes
      const sortedRefs = [...tweetContext.referenced_tweets].sort((a, b) => {
        const typeOrder = { 'replied_to': 0, 'quoted': 1, 'retweeted': 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      sortedRefs.forEach(ref => {
        const refType = ref.type === 'replied_to' ? 'Reply to' : 
                       ref.type === 'quoted' ? 'Quote of' : 
                       'Retweet of';
        context += `[${refType}] @${ref.author}: "${ref.text}"\n`;
      });
    }

    // Then add conversation context if available
    if (tweetContext.conversation?.length) {
      // Sort conversation by timestamp if available
      const sortedConversation = [...tweetContext.conversation].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return 0;
      });

      context += '\nConversation Flow:\n';
      sortedConversation.forEach((tweet, index) => {
        const timestamp = tweet.created_at 
          ? `[${new Date(tweet.created_at).toLocaleTimeString()}] `
          : '';
        context += `${timestamp}@${tweet.author}: "${tweet.text}"\n`;
      });
    }
  }

  // Add thread structure information
  if (tweetContext.referenced_tweets?.some(ref => ref.type === 'replied_to')) {
    context += '\nNote: This is a reply in a conversation thread.';
  }
  if (tweetContext.referenced_tweets?.some(ref => ref.type === 'quoted')) {
    context += '\nNote: This tweet quotes another tweet.';
  }

  return `Tweet by @${tweetContext.author}:
"${tweetContext.text}"

${timestamp}
${engagement}
${context}

Write a short, sharp reply that sounds like Peter from BlockyDevs.
Stay grounded, insightful, and direct — no fluff, no hype.
Don't explain the tweet. Add something valuable or challenge it.
Assume you're replying in a fast-paced group chat. No intros or sign-offs.`;
}

  /**
   * Generates a reply for a given tweet
   * @param tweetContext - The context of the tweet to reply to
   * @param tone - Array of desired tones for the reply
   * @returns Promise containing the generated reply
   * @throws {Error} If the API request fails
   */
  async generateReply(tweetContext: TweetContext, tone: (keyof typeof prompts.tone)[] = ['humorous', 'curious']): Promise<GeneratedReply> {
    try {
      const systemPrompt = this.buildSystemPrompt(tone);
      const userPrompt = this.buildUserPrompt(tweetContext);

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.maxLength,
        temperature: 0.8,
      });

      const reply = completion.choices[0]?.message?.content;
      if (!reply) {
        throw new Error('No reply generated');
      }

      return {
        content: reply,
        metadata: {
          model: this.model,
          timestamp: new Date(),
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error generating reply:', error);
      throw new Error(`Failed to generate reply: ${error.message}`);
    }
  }
}
