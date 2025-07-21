# Adminer Database Management

This directory contains Adminer, a lightweight database management tool for MySQL.

## Quick Start

1. Make sure you have PHP installed on your system
2. Run the start script:
   ```bash
   ./start-adminer.sh
   ```
3. Open your browser and go to: http://localhost:8080

## Database Connection Details

- **System**: MySQL
- **Server**: localhost
- **Username**: root
- **Password**: 12345678
- **Database**: personal_tutor_ai

## Alternative: Manual Start

If the script doesn't work, you can start Adminer manually:

```bash
php -S localhost:8080 adminer.php
```

## What You Can Do

- Browse and edit tables
- Execute SQL queries
- Import/export data
- Manage database structure
- View relationships between tables

## Security Note

This is for development use only. In production, use proper database management tools with appropriate security measures. 