# General Development Rules

## Tech Stack

- **Frontend**: SvelteKit 2.x with TypeScript
- **Backend**: SvelteKit API routes with Node.js
- **Database**: MySQL with mysql2 driver
- **Authentication**: JWT with bcryptjs
- **AI Integration**: OpenAI API
- **Build Tool**: Vite

## Code Style

### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Use type guards for runtime type checking
- Avoid `any` type - use proper typing
- Implement proper error handling with typed errors

### SvelteKit Conventions
- Follow file-based routing in `src/routes/`
- Use `+page.svelte` for pages, `+server.ts` for API endpoints
- Place shared utilities in `src/lib/`
- Use `$lib` alias for imports
- Implement proper loading and error states

### Code Organization
- Keep components small and focused
- Use consistent naming conventions (camelCase for variables, PascalCase for components)
- Add JSDoc comments for complex functions
- Separate business logic from UI components

## Database & API

### Database Operations
- Use parameterized queries to prevent SQL injection
- Implement proper error handling for database operations
- Use transactions for multi-step operations
- Validate data before database operations
- Follow the schema defined in `database/schema.sql`

### API Design
- Use RESTful conventions for API endpoints
- Implement proper HTTP status codes
- Return consistent JSON response formats
- Add input validation for all API endpoints
- Use proper error handling and logging

## AI Integration

### OpenAI API Usage
- Implement proper rate limiting and error handling
- Use streaming responses for better UX
- Cache responses when appropriate
- Validate AI responses before using them
- Follow the course generation guidelines in `system-prompt.md`

### Course Generation
- Follow the structured format defined in `system-prompt.md`
- Include video resources when relevant
- Validate generated content before saving
- Implement proper error handling for AI failures

## Security

### Authentication & Authorization
- Use JWT tokens with proper expiration
- Hash passwords with bcryptjs
- Implement proper session management
- Validate user permissions for protected routes
- Use HTTPS in production

### Input Validation
- Validate all user inputs on both client and server
- Sanitize data before database operations
- Use TypeScript for compile-time type safety
- Implement proper CSRF protection

## Testing & Quality

### Testing Strategy
- Test API endpoints with proper error scenarios
- Verify database operations and data integrity
- Test AI integration with mock responses
- Validate UI components across different screen sizes
- Test authentication and authorization flows

### Performance
- Optimize database queries and use indexes
- Implement proper caching strategies
- Minimize bundle size with code splitting
- Use efficient algorithms for data processing
- Monitor API response times

## Environment & Deployment

### Environment Variables
- Use `.env` files for configuration
- Never commit sensitive data to version control
- Use different environments for dev/staging/production
- Validate required environment variables on startup

### Development Workflow
- Use `npm run dev` for local development
- Use `npm run build` for production builds
- Use `npm run check` for TypeScript validation
- Follow Git workflow with proper commit messages

## Documentation

### Code Documentation
- Document complex business logic with JSDoc
- Keep README files updated with setup instructions
- Document API endpoints and their expected responses
- Update `style.md` when adding new UI patterns

### Project Documentation
- Maintain clear setup instructions in README
- Document database schema changes
- Keep API documentation current
- Update deployment procedures when needed 