# Secrets Management

This project uses a secure secrets management system to keep sensitive information out of git.

## File Structure

- **`secrets.env`** - Contains actual API keys and secrets (NEVER committed to git)
- **`env.template`** - Template file showing what environment variables are needed
- **`env.production`** - Production configuration template with placeholders
- **`env.remote`** - Remote deployment configuration template with placeholders

## Setup Instructions

### For Local Development

1. Copy the template:
   ```bash
   cp env.template .env
   ```

2. Get actual values from `secrets.env` and fill them in your `.env` file
   OR source the secrets directly:
   ```bash
   # In your shell or in a startup script
   source secrets.env
   ```

### For Production Deployment

1. Copy values from `secrets.env` to your production environment
2. Update `env.production` or `env.remote` with your actual values (on the server only)
3. Never commit the filled-in production files to git

## Security Notes

- `secrets.env` is in `.gitignore` and should NEVER be committed
- Template files (`.env.template`, `env.production`, `env.remote`) contain placeholders only
- Always verify `.gitignore` is properly configured before committing
- Rotate API keys regularly and update `secrets.env` accordingly

## Adding New Secrets

1. Add the actual value to `secrets.env`
2. Add a placeholder to the relevant template files
3. Update this README if needed