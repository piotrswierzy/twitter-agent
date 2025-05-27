/**
 * Interface representing the context of a tweet for content generation.
 * This interface provides the necessary information for generating
 * appropriate replies to tweets.
 */
export interface TweetContext {
  /**
   * The text content of the tweet
   */
  text: string;

  /**
   * The timestamp when the tweet was created
   */
  createdAt: Date;

  /**
   * The username of the tweet author
   */
  author: string;
} 