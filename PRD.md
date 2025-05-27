# 🧠 PRD — Twitter AI Bot (NestJS + TypeORM)

## 📌 Project Name
**twitter-ai-bot-nestjs**

## 🎯 Objective
Build a NestJS-based AI bot that:
- Monitors selected Twitter users or hashtags
- Generates tone-specific replies via OpenAI
- Sends replies for approval via Telegram bot
- Posts approved replies to Twitter
- Logs all data in PostgreSQL using TypeORM

---

## ✅ Core Features

### 1. Twitter Monitoring
- Listen to tweets from defined users or hashtags
- Store each tweet in the database

### 2. AI-Powered Reply Generation
- Use OpenAI API to generate replies in a custom tone
- Prompt includes a system message and few-shot examples

### 3. Approval Flow (Telegram Bot)
- Send tweet + generated reply to Telegram
- Approve, reject, or edit via inline buttons
- Save status to the database

### 4. Tweet Poster
- Post replies that are approved and not yet sent
- Mark as posted once successful

### 5. Database Logging
- Use TypeORM with PostgreSQL
- Store all tweet metadata and replies

---

## 🚫 Out of Scope (V1)
- Discord integration
- Embedding or vector DB
- Auto-posting without human approval

---

## 🧠 Tone Setup
- System prompt stored in JSON config
- Optional: few-shot examples in the prompt

---

## 🧩 Suggested NestJS Modules

| Module        | Purpose                                   |
|---------------|-------------------------------------------|
| `TwitterModule` | Handles tweet ingestion & filtering       |
| `AiModule`      | Handles OpenAI prompt + generation logic |
| `BotModule`     | Telegram bot approval interface           |
| `DbModule`      | TypeORM entities + data logic             |
| `TasksModule`   | Cron jobs for checking & posting          |
| `ConfigModule`  | `.env` & config support                   |

---

## 🗂 Suggested Database Schema (TypeORM)

### Entity: `Tweet`
```ts
@Entity()
export class Tweet {
  @PrimaryColumn()
  id: string;

  @Column()
  author: string;

  @Column('text')
  content: string;

  @Column()
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
```

### Entity: `Reply`
```ts
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
}
```

---

## 🏗 Setup Checklist

1. `npx @nestjs/cli new twitter-ai-bot-nestjs`
2. `npm install @nestjs/typeorm typeorm pg @nestjs/config @nestjs/schedule axios openai node-telegram-bot-api`
3. Configure `.env` with:
   ```env
   OPENAI_API_KEY=sk-...
   TWITTER_BEARER=...
   TELEGRAM_TOKEN=...
   TELEGRAM_CHAT_ID=...
   DATABASE_URL=postgres://...
   ```
4. Create modules: `twitter`, `ai`, `bot`, `db`, `tasks`
5. Set up `AppModule` with all sub-modules
6. Create a config file: `src/config/prompt.json` for tone prompt
7. Implement services:
   - Twitter fetch → DB
   - AI generate → reply
   - Telegram notify → approve
   - Poster → schedule post
8. Add `ScheduleModule` for cron jobs
9. Add logic to check/post approved replies
