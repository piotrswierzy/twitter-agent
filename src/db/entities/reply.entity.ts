import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Tweet } from './tweet.entity';

/**
 * Interface for reply metadata
 */
export interface ReplyMetadata {
  model: string;
  timestamp: Date;
  promptTokens: number;
  completionTokens: number;
}

@Entity()
export class Reply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tweet, (tweet) => tweet.replies)
  tweet: Tweet;

  @Column('text')
  replyText: string;

  @Column({ default: false })
  approved: boolean;

  @Column({ default: false })
  posted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  postedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: ReplyMetadata;
} 