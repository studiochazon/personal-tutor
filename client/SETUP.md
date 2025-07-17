# Setup Guide for Course Creation Feature

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key to use the course creation feature.
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Create an API key in your account settings
   - Copy the API key

## Environment Configuration

Create a `.env` file in the root directory of your project with the following content:

```env
OPENAI_API_KEY=your_actual_openai_api_key_here
```

Replace `your_actual_openai_api_key_here` with your real OpenAI API key.

## Installation

1. Install the new dependencies:
   ```bash
   cd client
   yarn install
   ```

2. Make sure your database is running and the schema is set up correctly.

## Usage

1. Start the development server:
   ```bash
   yarn dev
   ```

2. Navigate to `/start` in your browser to access the course creation interface.

3. Chat with the AI to create your course:
   - Describe what you want to teach
   - Answer the AI's questions about your course
   - Let the AI generate a course structure
   - Confirm to create the course in your database

## Features

- **Chat Interface**: ChatGPT-like interface for course creation
- **AI-Powered**: Uses GPT-4 to generate course content and structure
- **Database Integration**: Automatically saves courses and lessons to your database
- **Smart Extraction**: AI extracts structured course data from conversations
- **Responsive Design**: Works on desktop and mobile devices

## System Prompt

The AI uses a specialized system prompt that helps it:
- Understand course creation best practices
- Structure courses logically
- Generate appropriate content for different difficulty levels
- Create engaging lesson plans

## Troubleshooting

1. **"OpenAI API key not configured" error**:
   - Make sure you've created the `.env` file
   - Verify your API key is correct
   - Restart the development server after adding the `.env` file

2. **Database connection errors**:
   - Ensure your MySQL database is running
   - Check the database configuration in `src/lib/config.ts`
   - Verify the database schema is properly set up

3. **Course creation fails**:
   - Check the browser console for error messages
   - Verify the database tables exist and have the correct structure
   - Ensure you have at least one user in the database (the system uses user ID 1 by default)

## Security Notes

- Never commit your `.env` file to version control
- Keep your OpenAI API key secure
- Consider implementing proper user authentication before production use
- Monitor your OpenAI API usage to avoid unexpected costs 