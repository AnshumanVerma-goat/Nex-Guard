import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('nex_guard.db');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.execAsync(CREATE_TABLES_SQL);
    console.log('[LOCAL DB] SQLite database initialized successfully (nex_guard.db)');
  } catch (error) {
    console.error('[LOCAL DB ERROR] Failed to initialize SQLite database:', error);
    throw error;
  }
}
