# Database Compatibility Guide for v3 Engine Migration

## 🗄️ Database Engine Support

The v3 Engine migration has been adapted for multiple database engines:

| Database | Migration File | Status | Notes |
|----------|---------------|---------|-------|
| **MySQL** | `add-v3-engine-support.sql` | ✅ Original | Full feature support |
| **PostgreSQL** | `add-v3-engine-support-postgresql.sql` | ✅ Compatible | JSONB, functions |
| **SQLite** | `add-v3-engine-support-sqlite.sql` | ✅ Compatible | Limited features |

## 🔄 Key Differences by Database

### MySQL (Original)
```sql
-- ENUM types
status ENUM('draft', 'published') DEFAULT 'draft'

-- AUTO_INCREMENT
id INT PRIMARY KEY AUTO_INCREMENT

-- JSON data type
processing_steps JSON

-- Stored procedures with DELIMITER
DELIMITER //
CREATE PROCEDURE LogV3CourseCreation(...)
```

### PostgreSQL
```sql
-- CHECK constraints instead of ENUM
status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published'))

-- SERIAL instead of AUTO_INCREMENT
id SERIAL PRIMARY KEY

-- JSONB for better performance
processing_steps JSONB

-- Functions instead of procedures
CREATE OR REPLACE FUNCTION log_v3_course_creation(...)
RETURNS INTEGER AS $$
```

### SQLite
```sql
-- TEXT with CHECK constraints
status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'))

-- AUTOINCREMENT
id INTEGER PRIMARY KEY AUTOINCREMENT

-- JSON as TEXT
processing_steps TEXT

-- No stored procedures/functions
-- (Handle in application code)
```

## 📊 Feature Comparison

| Feature | MySQL | PostgreSQL | SQLite |
|---------|-------|------------|--------|
| **ENUM Types** | ✅ Native | ❌ CHECK constraints | ❌ CHECK constraints |
| **JSON Support** | ✅ JSON | ✅ JSONB (better) | ❌ TEXT storage |
| **Auto Increment** | ✅ AUTO_INCREMENT | ✅ SERIAL | ✅ AUTOINCREMENT |
| **Stored Procedures** | ✅ Full support | ✅ Functions | ❌ None |
| **Timestamp Updates** | ✅ ON UPDATE | ❌ Triggers needed | ❌ Application logic |
| **Comments** | ✅ Table/column | ✅ COMMENT ON | ❌ None |

## 🚨 Compatibility Issues & Solutions

### 1. ENUM vs CHECK Constraints
**Issue**: MySQL ENUM not available in PostgreSQL/SQLite
**Solution**: Use VARCHAR with CHECK constraints

```sql
-- MySQL
audience ENUM('beginner', 'intermediate', 'advanced')

-- PostgreSQL/SQLite  
audience VARCHAR(20) CHECK (audience IN ('beginner', 'intermediate', 'advanced'))
```

### 2. JSON Data Storage
**Issue**: Different JSON support across databases
**Solutions**:
- **PostgreSQL**: Use JSONB for better performance
- **SQLite**: Store as TEXT, parse in application
- **MySQL**: Use native JSON type

### 3. Auto-Increment Columns
**Issue**: Different syntax for auto-incrementing primary keys
**Solutions**:
```sql
-- MySQL
id INT PRIMARY KEY AUTO_INCREMENT

-- PostgreSQL
id SERIAL PRIMARY KEY

-- SQLite
id INTEGER PRIMARY KEY AUTOINCREMENT
```

### 4. Stored Procedures/Functions
**Issue**: Different syntax and capabilities
**Solutions**:
- **MySQL**: Stored procedures with DELIMITER
- **PostgreSQL**: Functions with plpgsql
- **SQLite**: Handle in application code

### 5. Timestamp Handling
**Issue**: Different timestamp features and auto-updates
**Solutions**:
```sql
-- MySQL (auto-update)
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

-- PostgreSQL (trigger needed)
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- SQLite (application logic)
updated_at TEXT DEFAULT (datetime('now'))
```

## 🛠️ Application Code Adaptations

### Database Connection Configuration
```typescript
// config/database.ts
export const getDatabaseConfig = () => {
  const dbType = process.env.DB_TYPE || 'mysql';
  
  switch (dbType) {
    case 'postgresql':
      return {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        jsonType: 'jsonb'
      };
    case 'sqlite':
      return {
        client: 'sqlite3',
        connection: { filename: process.env.DB_FILE },
        jsonType: 'text'
      };
    default: // mysql
      return {
        client: 'mysql2',
        connection: process.env.DATABASE_URL,
        jsonType: 'json'
      };
  }
};
```

### JSON Handling
```typescript
// lib/database-utils.ts
export const storeJSON = (data: any, dbType: string) => {
  switch (dbType) {
    case 'postgresql':
    case 'mysql':
      return data; // Native JSON support
    case 'sqlite':
      return JSON.stringify(data); // Store as TEXT
    default:
      return JSON.stringify(data);
  }
};

export const retrieveJSON = (data: any, dbType: string) => {
  switch (dbType) {
    case 'postgresql':
    case 'mysql':
      return data; // Already parsed
    case 'sqlite':
      return typeof data === 'string' ? JSON.parse(data) : data;
    default:
      return typeof data === 'string' ? JSON.parse(data) : data;
  }
};
```

### Logging Functions
```typescript
// lib/v3-logging.ts
export const logV3CourseCreation = async (logData: V3LogData) => {
  const dbType = process.env.DB_TYPE || 'mysql';
  
  switch (dbType) {
    case 'mysql':
      // Use stored procedure
      await connection.execute('CALL LogV3CourseCreation(?)', [logData]);
      break;
      
    case 'postgresql':
      // Use function
      await connection.query('SELECT log_v3_course_creation($1)', [logData]);
      break;
      
    case 'sqlite':
    default:
      // Direct INSERT
      await connection('v3_engine_logs').insert(logData);
      break;
  }
};
```

## 🚀 Migration Instructions

### For MySQL (Default)
```bash
mysql -u username -p database_name < database-migrations/add-v3-engine-support.sql
```

### For PostgreSQL
```bash
psql -U username -d database_name -f database-migrations/add-v3-engine-support-postgresql.sql
```

### For SQLite
```bash
sqlite3 database.db < database-migrations/add-v3-engine-support-sqlite.sql
```

## 📝 Application Configuration

### Environment Variables
```bash
# Database type selection
DB_TYPE=mysql|postgresql|sqlite

# MySQL
DATABASE_URL=mysql://user:pass@host:port/database

# PostgreSQL  
DATABASE_URL=postgresql://user:pass@host:port/database

# SQLite
DB_FILE=./database.sqlite
```

### SvelteKit Configuration
```typescript
// src/lib/database.ts
import { getDatabaseConfig } from './config/database';

const config = getDatabaseConfig();
export const connection = knex(config);
```

## ⚠️ Limitations by Database

### SQLite Limitations
- No stored procedures/functions
- JSON stored as TEXT (manual parsing required)
- No native ENUM support
- Limited concurrent write operations
- No ON UPDATE timestamp support

### PostgreSQL Considerations
- JSONB is better than JSON for performance
- Requires different function syntax
- Better for concurrent operations
- Excellent JSON query capabilities

### MySQL Advantages
- Native ENUM support
- Built-in JSON functions
- ON UPDATE timestamps
- Stored procedure support
- Full compatibility with existing codebase

## 🎯 Recommendations

1. **Development**: Use SQLite for simplicity
2. **Production**: Use PostgreSQL for scalability  
3. **Legacy**: Stick with MySQL if already established
4. **JSON-heavy apps**: PostgreSQL with JSONB
5. **Simple apps**: SQLite is sufficient

Choose the migration file that matches your target database engine!