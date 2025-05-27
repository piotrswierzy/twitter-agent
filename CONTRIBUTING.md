# Contributing to Twitter AI Bot 🤖

Thank you for your interest in contributing to Twitter AI Bot! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the Issues section
- Use the bug report template when creating a new issue
- Include detailed steps to reproduce the bug
- Include screenshots if applicable
- Specify your environment (OS, Node.js version, etc.)

### Suggesting Features

- Check if the feature has already been suggested
- Use the feature request template
- Provide a clear description of the feature
- Explain why this feature would be useful
- Include any relevant mockups or examples

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`bun run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Start the development server:
   ```bash
   bun run start:dev
   ```

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Write meaningful commit messages
- Add comments for complex logic
- Keep functions small and focused
- Write tests for new features

### Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Update tests when modifying existing features
- Use meaningful test descriptions

### Documentation

- Update README.md if needed
- Add JSDoc comments for new functions
- Update API documentation
- Document any new environment variables

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation with any new features
3. The PR will be merged once you have the sign-off of at least one maintainer
4. Make sure all tests pass
5. Address any review comments

## Questions?

Feel free to open an issue for any questions or concerns about contributing. 