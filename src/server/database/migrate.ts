import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

async function migrate() {
  const db = await open({
    filename: 'personal-tutor.db',
    driver: sqlite3.Database
  });
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await db.exec(schema);
  await db.close();
  console.log('Database migrated successfully.');
}

migrate(); 