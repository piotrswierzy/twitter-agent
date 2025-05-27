# Twitter AI Bot 🤖

A NestJS-based AI bot that monitors Twitter, generates intelligent replies, and manages them through a Telegram approval workflow.

## 🌟 Features

- **Twitter Monitoring**: Track tweets from specific users or hashtags
- **AI-Powered Replies**: Generate context-aware responses using OpenAI
- **Telegram Approval**: Review and manage replies through a Telegram bot
- **Smart Filtering**: Filter tweets based on engagement, keywords, and age
- **Database Logging**: Store all interactions in PostgreSQL using TypeORM

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd twitter-agent
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start the application**
   ```bash
   # Development
   bun run start:dev

   # Production
   bun run start:prod
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Twitter API
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret

# OpenAI
OPENAI_API_KEY=your_openai_key

# Telegram
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/twitter_bot

# Application
PORT=3000
NODE_ENV=development
```

### Filter Configuration

Configure tweet filtering in `src/config/filter.config.ts`:

```typescript
export const filterConfig = {
  engagement: {
    minLikes: 10,
    minRetweets: 5,
    minReplies: 2
  },
  keywords: {
    include: ['ai', 'technology'],
    exclude: ['spam', 'ad']
  },
  age: {
    maxHours: 24
  }
};
```

## 📁 Project Structure

```
src/
├── content-approval/     # Telegram bot and approval workflow
├── content-generator/    # OpenAI integration and reply generation
├── db/                  # Database entities and services
├── tasks/              # Scheduled tasks and cron jobs
├── twitter/            # Twitter API integration
└── config/             # Application configuration
```

## 🔄 Workflow

1. **Tweet Monitoring**
   - Bot monitors specified Twitter accounts/hashtags
   - New tweets are filtered based on engagement and keywords
   - Filtered tweets are stored in the database

2. **Reply Generation**
   - OpenAI generates context-aware replies
   - Replies are formatted and stored in the database

3. **Approval Process**
   - Generated replies are sent to Telegram
   - Approvers can:
     - ✅ Approve the reply
     - ❌ Reject the reply
     - ✏️ Edit the reply text

4. **Posting**
   - Approved replies are posted to Twitter
   - All actions are logged in the database

## 🛠️ Development

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL 14+
- Twitter Developer Account
- OpenAI API Key
- Telegram Bot Token

### Commands

```bash
# Install dependencies
bun install

# Run in development mode
bun run start:dev

# Run tests
bun run test

# Build for production
bun run build

# Start production server
bun run start:prod
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📧 Support

For support, please open an issue in the GitHub repository or contact the maintainers.
