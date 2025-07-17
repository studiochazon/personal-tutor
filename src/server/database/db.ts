import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export async function getDb(): Promise<Database> {
  return open({
    filename: 'personal-tutor.db',
    driver: sqlite3.Database
  });
} 