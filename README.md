# Personal Tutor AI

A modern AI-powered learning platform that creates personalized educational courses and provides intelligent tutoring.

## Project Structure

- `client/` - SvelteKit frontend application
- `database/` - Database schema and migrations
- `adminer/` - Database administration tool
- `.cursor/rules/` - **Development Rules** - Complete development guidelines and style guide

## Quick Start

1. **Setup Database**
   ```bash
   ./setup-database.sh
   ```

2. **Start Frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Database Admin** (optional)
   ```bash
   cd adminer
   ./start-adminer.sh
   ```

## Development

### UI/UX Guidelines

**IMPORTANT**: All development must follow the guidelines defined in [`.cursor/rules/`](./.cursor/rules/). This includes:

- Color palette and typography
- Component design patterns
- Spacing and layout guidelines
- Accessibility requirements
- Responsive design principles

### Key Features

- AI-powered course generation
- Personalized learning paths
- Interactive lessons with video integration
- Progress tracking and analytics
- Modern, accessible UI design

## Documentation

- [`.cursor/rules/`](./.cursor/rules/) - Complete development guidelines and style guide
- [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) - Database setup instructions
- [`system-prompt.md`](./system-prompt.md) - LLM course generation guidelines
- [`VIDEO_INTEGRATION_REPORT.md`](./VIDEO_INTEGRATION_REPORT.md) - Video feature documentation

## Contributing

When developing:
1. Always reference [`.cursor/rules/`](./.cursor/rules/) for development guidelines
2. Follow the established color palette and typography
3. Maintain accessibility standards
4. Test responsive behavior across devices 