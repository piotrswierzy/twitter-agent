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
1. Keep replies under ${this.maxLength} characters
2. Use only standard keyboard characters – no special symbols, quotes, or em dashes
3. Be authentic, grounded, and true to your character
4. Avoid fluff, abstract statements, and poetic phrasing
5. Focus on insight, clarity, and practical value
6. Use dry humor when it sharpens a point, not just to entertain
7. Be direct. Don't sugarcoat. Don't overexplain
8. Question vague assumptions or bad ideas, calmly and clearly
9. Match the tone of the original tweet, but bring a sharper perspective
10. Prioritize brevity – most replies should be under 3 sentences

Formatting Rules:
- No emojis or exclamation marks
- Never use metaphors or motivational language
- Write like you're replying in a fast-paced group chat
- Skip introductions like "Hey" or "I think..." — go straight to the point

Final Note:
Do NOT try to sound poetic, clever, or overly nice. This is not customer service. This is a grounded, smart, dry-witted founder giving real thoughts. Clarity > charm. Insight > inspiration.`;
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

  return `Tweet by @${tweetContext.author}:
"${tweetContext.text}"

${timestamp}
${engagement}

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
