<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ bun install
```

## Compile and run the project

```bash
# development
$ bun run start

# watch mode
$ bun run start:dev

# production mode
$ bun run start:prod
```

## Run tests

```bash
# unit tests
$ bun run test

# e2e tests
$ bun run test:e2e

# test coverage
$ bun run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ bun install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

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

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For support, please open an issue in the GitHub repository or contact the maintainers.
