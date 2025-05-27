import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Reply } from './reply.entity';

@Entity()
export class Tweet {
  @PrimaryColumn()
  id: string;

  @Column()
  author: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  source: string; // "user", "hashtag", etc.

  @Column({ default: false })
  replied: boolean;

  @Column({ default: false })
  approved: boolean;

  @Column({ default: false })
  posted: boolean;

  @OneToMany(() => Reply, (reply) => reply.tweet)
  replies: Reply[];
} 