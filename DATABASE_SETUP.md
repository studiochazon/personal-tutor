# Database Setup Guide

## Prerequisites

1. **MySQL Server** - Make sure MySQL is installed and running
2. **MySQL Client** - For running SQL commands

## Setup Options

### Option 1: Using the Setup Script (Recommended)

1. **Update the database configuration** in `client/src/lib/config.ts`:
   ```typescript
   export const dbConfig = {
       host: 'localhost',
       user: 'root',
       password: 'your_mysql_password', // Update this
       database: 'personal_tutor_ai',
       port: 3306
   };
   ```

2. **Update the setup script** in `setup-database.sh`:
   ```bash
   DB_PASSWORD="your_mysql_password"  # Update this
   ```

3. **Run the setup script**:
   ```bash
   ./setup-database.sh
   ```

### Option 2: Manual Setup

1. **Connect to MySQL**:
   ```bash
   mysql -u root -p
   ```

2. **Create the database**:
   ```sql
   CREATE DATABASE personal_tutor_ai;
   USE personal_tutor_ai;
   ```

3. **Run the schema file**:
   ```bash
   mysql -u root -p personal_tutor_ai < database/schema.sql
   ```

### Option 3: Using MySQL Workbench or phpMyAdmin

1. Create a new database named `personal_tutor_ai`
2. Import the `database/schema.sql` file

## Common MySQL Password Locations

### macOS (Homebrew)
- Default: No password (try `mysql -u root`)
- If that fails, try: `mysql -u root -p` (press Enter for no password)
- Or check: `cat ~/.my.cnf` for credentials

### macOS (Official Installer)
- Password is set during installation
- Check your installation notes

### Linux
- Default: No password or `sudo mysql`
- Or check: `sudo cat /etc/mysql/debian.cnf`

### Windows
- Password set during installation
- Check MySQL installation directory

## Troubleshooting

### "Access denied" Error
1. Try connecting without password: `mysql -u root`
2. Try with password prompt: `mysql -u root -p`
3. Reset MySQL root password if needed

### "Connection refused" Error
1. Start MySQL service:
   ```bash
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   
   # Windows
   net start mysql
   ```

### "Database doesn't exist" Error
1. Create the database manually:
   ```sql
   CREATE DATABASE personal_tutor_ai;
   ```

## Verification

After setup, you should have:
- 3 users (admin, teacher, instructor)
- 6 courses with different difficulties
- 18+ lessons across all courses
- All tables with proper relationships

Check with:
```sql
USE personal_tutor_ai;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM lessons;
```

## Next Steps

1. Update the database configuration in `client/src/lib/config.ts`
2. Start the development server: `cd client && yarn dev`
3. Visit `http://localhost:5173` to see your application
4. Navigate to `/courses` to see the database-driven course listing 