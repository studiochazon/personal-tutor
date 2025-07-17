# Database Setup Guide

## Issue Resolution

The application is currently failing to connect to MySQL due to authentication issues. Here's how to fix it:

## Step 1: Create Environment Variables

Create a `.env` file in the `client` directory with the following content:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=personal_tutor_ai
DB_PORT=3306

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

## Step 2: Update Database Configuration

The application now uses environment variables for database configuration. Make sure your MySQL credentials are correct:

### Option A: If you have a MySQL password
```bash
DB_PASSWORD=your_actual_password
```

### Option B: If you want to use no password (not recommended for production)
```bash
DB_PASSWORD=
```

### Option C: Create a new MySQL user (recommended)
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create a new user for the application
CREATE USER 'personal_tutor'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON personal_tutor_ai.* TO 'personal_tutor'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

Then update your `.env` file:
```bash
DB_USER=personal_tutor
DB_PASSWORD=your_secure_password
```

## Step 3: Run Database Setup

Execute the database setup script:

```bash
chmod +x setup-database.sh
./setup-database.sh
```

## Step 4: Verify Connection

Test the database connection:

```bash
mysql -u your_user -p personal_tutor_ai -e "SELECT COUNT(*) FROM courses;"
```

## Common Issues and Solutions

### Issue: "Access denied for user 'root'@'localhost'"
**Solution**: 
1. Check if you're using the correct password
2. Try connecting manually: `mysql -u root -p`
3. If no password works, reset MySQL root password

### Issue: "Database doesn't exist"
**Solution**: 
1. Run the setup script: `./setup-database.sh`
2. Or manually create: `CREATE DATABASE personal_tutor_ai;`

### Issue: "Tables don't exist"
**Solution**: 
1. Run the schema file: `mysql -u your_user -p personal_tutor_ai < database/schema.sql`

## Testing the Application

After setting up the database:

1. Start the development server:
```bash
cd client
yarn dev
```

2. Visit `http://localhost:5173/start`
3. Try creating a course to test the full flow

## Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for production environments
- Consider using a dedicated database user instead of root
- Regularly backup your database

## Troubleshooting

If you're still having issues:

1. Check MySQL service status: `sudo systemctl status mysql`
2. Verify MySQL is listening: `netstat -tlnp | grep 3306`
3. Check MySQL error logs: `sudo tail -f /var/log/mysql/error.log`
4. Test connection with different credentials 