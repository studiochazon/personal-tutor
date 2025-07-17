# Personal Tutor AI - Schema Documentation

This directory contains the schema documentation for the Personal Tutor AI MVP. These files serve as a single source of truth for both database and frontend development.

## Files Overview

### `schema.json`
- **Purpose**: Comprehensive schema definition in JSON format
- **Contains**: Database tables, API endpoints, frontend types, validation rules
- **Usage**: Reference for development, can be parsed by tools for code generation
- **Keep Updated**: This is the master schema file - update this first!

### `types.ts`
- **Purpose**: TypeScript type definitions for frontend development
- **Contains**: Interfaces matching the database schema and API responses
- **Usage**: Import in SvelteKit components for type safety
- **Keep Updated**: Should match `schema.json` exactly

### `database/schema.sql`
- **Purpose**: MySQL database schema and sample data
- **Contains**: CREATE TABLE statements, indexes, sample data, views, stored procedures
- **Usage**: Run this file to set up your database
- **Keep Updated**: Should match `schema.json` exactly

## How to Use

### For Database Development
1. Update `schema.json` with any schema changes
2. Update `database/schema.sql` to match
3. Run the SQL file to update your database:
   ```bash
   mysql -u username -p database_name < database/schema.sql
   ```

### For Frontend Development
1. Import types from `types.ts`:
   ```typescript
   import type { Course, Lesson, Progress } from './types';
   ```
2. Use types in your SvelteKit components:
   ```typescript
   let courses: Course[] = [];
   let currentLesson: Lesson | null = null;
   ```

### For API Development
1. Reference the API endpoints in `schema.json`
2. Ensure your SvelteKit API routes match the defined endpoints
3. Use the request/response types from `types.ts`

## Schema Maintenance

### When Making Changes
1. **Always update `schema.json` first** - this is the master file
2. Update `types.ts` to match the schema
3. Update `database/schema.sql` if database structure changes
4. Update this README if needed

### Validation
- Ensure all TypeScript types match the JSON schema
- Verify database constraints match the schema definition
- Test API endpoints against the defined specifications

## Database Setup

### Prerequisites
- MySQL 8.0+ installed
- Database user with CREATE privileges

### Setup Steps
1. Create a new database:
   ```sql
   CREATE DATABASE personal_tutor_ai;
   USE personal_tutor_ai;
   ```

2. Run the schema file:
   ```bash
   mysql -u your_username -p personal_tutor_ai < database/schema.sql
   ```

3. Verify the setup:
   ```sql
   SHOW TABLES;
   SELECT * FROM users;
   SELECT * FROM courses;
   ```

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Courses
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get single course with lessons
- `POST /api/courses` - Create new course (authenticated)
- `PUT /api/courses/:id` - Update course (authenticated, owner only)
- `DELETE /api/courses/:id` - Delete course (authenticated, owner only)

### Lessons
- `GET /api/lessons/:id` - Get single lesson
- `POST /api/courses/:courseId/lessons` - Create new lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson

### Progress
- `GET /api/progress` - Get user progress (authenticated)
- `POST /api/progress` - Update lesson progress (authenticated)
- `GET /api/courses/:courseId/progress` - Get course progress (authenticated)

## Frontend Routes

- `/` - Homepage with course listing
- `/courses` - All courses page
- `/courses/[id]` - Single course page with lesson list
- `/courses/[courseId]/lessons/[lessonId]` - Single lesson page
- `/auth/login` - Login page
- `/auth/register` - Register page
- `/dashboard` - User dashboard with progress (authenticated)
- `/create` - Course creation page (authenticated)

## Validation Rules

- **Email**: Valid email format, max 255 characters
- **Password**: Minimum 8 characters, at least one letter and one number
- **Title**: Required, max 255 characters
- **Content**: Required for lessons
- **Order Index**: Must be positive integer
- **Difficulty**: Must be one of: beginner, intermediate, advanced
- **Estimated Duration**: Must be positive integer if provided

## Notes

- Lesson content supports markdown for rich formatting
- Use JWT tokens or SvelteKit sessions for authentication
- Consider cloud storage (AWS S3, Cloudinary) for image uploads
- Implement cursor-based pagination for better performance
- Consider Redis for caching frequently accessed data
- Implement full-text search using MySQL FULLTEXT or external service

## Troubleshooting

### Common Issues
1. **Type mismatches**: Ensure `types.ts` matches `schema.json`
2. **Database errors**: Check that SQL schema matches JSON definition
3. **API errors**: Verify endpoint definitions match implementation

### Getting Help
- Check the schema files for the correct structure
- Verify all foreign key relationships are properly defined
- Ensure indexes are created for frequently queried columns 