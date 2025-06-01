import { Tweet } from '../../db/entities/tweet.entity';
import { Reply } from '../../db/entities/reply.entity';

/**
 * Interface defining the contract for approval strategies.
 * Each strategy must implement methods for sending content for approval
 * and handling approval actions.
 */
export interface ApprovalStrategy {
  /**
   * Sends a tweet and its reply for approval.
   * @param tweet The tweet to be approved
   * @param reply The generated reply to be approved
   */
  sendForApproval(tweet: Tweet, reply: Reply): Promise<void>;

  /**
   * Handles the approval of a reply.
   * @param tweetId The ID of the tweet being replied to
   * @param replyId The ID of the reply being approved
   * @returns Promise resolving to the scheduled posting time
   */
  handleApprove(tweetId: string, replyId: string): Promise<Date>;

  /**
   * Handles the rejection of a reply.
   * @param tweetId The ID of the tweet being replied to
   * @param replyId The ID of the reply being rejected
   */
  handleReject(tweetId: string, replyId: string): Promise<void>;

  /**
   * Handles the editing of a reply.
   * @param tweetId The ID of the tweet being replied to
   * @param replyId The ID of the reply being edited
   * @param editedText The new text for the reply
   */
  handleEdit(tweetId: string, replyId: string, editedText: string): Promise<void>;
} 