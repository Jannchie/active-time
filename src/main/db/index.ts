import Database from 'better-sqlite3';
import { app } from 'electron';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { and, eq, gte } from 'drizzle-orm';
import {
  backgroundDailyRecords,
  backgroundHourlyRecords,
  backgroundMinuteRecords,
  dailyRecords,
  foregroundDailyRecords,
  foregroundHourlyRecords,
  foregroundMinuteRecords,
  hourlyRecords,
  minuteRecords,
} from './schema';

const sqlite = new Database(`${app.getPath('userData')}/data.db`);
const db = drizzle(sqlite);

const ACTIVITY_TABLES = {
  day: dailyRecords,
  hour: hourlyRecords,
  minute: minuteRecords,
} as const;

const FOREGROUND_TABLES = {
  day: foregroundDailyRecords,
  hour: foregroundHourlyRecords,
  minute: foregroundMinuteRecords,
} as const;

const BACKGROUND_TABLES = {
  day: backgroundDailyRecords,
  hour: backgroundHourlyRecords,
  minute: backgroundMinuteRecords,
} as const;

const TABLE_NAMES = [
  'daily_records',
  'hourly_records',
  'minute_records',
  'foreground_daily_records',
  'foreground_hourly_records',
  'foreground_minute_records',
  'background_daily_records',
  'background_hourly_records',
  'background_minute_records',
] as const;

const ensureSchema = () => {
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS daily_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      event TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS daily_records_timestamp_program_event_idx
      ON daily_records (timestamp, program, event);
    CREATE TABLE IF NOT EXISTS hourly_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      event TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS hourly_records_timestamp_program_event_idx
      ON hourly_records (timestamp, program, event);
    CREATE TABLE IF NOT EXISTS minute_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      event TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS minute_records_timestamp_program_event_idx
      ON minute_records (timestamp, program, event);
    CREATE TABLE IF NOT EXISTS foreground_daily_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS foreground_daily_records_timestamp_program_idx
      ON foreground_daily_records (timestamp, program);
    CREATE TABLE IF NOT EXISTS foreground_hourly_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS foreground_hourly_records_timestamp_program_idx
      ON foreground_hourly_records (timestamp, program);
    CREATE TABLE IF NOT EXISTS foreground_minute_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS foreground_minute_records_timestamp_program_idx
      ON foreground_minute_records (timestamp, program);

    CREATE TABLE IF NOT EXISTS background_daily_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS background_daily_records_timestamp_program_idx
      ON background_daily_records (timestamp, program);

    CREATE TABLE IF NOT EXISTS background_hourly_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS background_hourly_records_timestamp_program_idx
      ON background_hourly_records (timestamp, program);

    CREATE TABLE IF NOT EXISTS background_minute_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT,
      timestamp INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS background_minute_records_timestamp_program_idx
      ON background_minute_records (timestamp, program);

    CREATE TABLE IF NOT EXISTS marked_programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS marked_programs_program_idx
      ON marked_programs (program);
  `);
};

const normalizeTimestampInput = (value: Date | number | string) => {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return value;
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeTimestampOutput = (value: unknown) => {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const migrateTimestampColumns = () => {
  for (const table of TABLE_NAMES) {
    sqlite
      .prepare(`
        UPDATE ${table}
        SET timestamp = CASE
          WHEN timestamp GLOB '*[^0-9]*'
            THEN CAST(strftime('%s', timestamp) AS INTEGER) * 1000
          ELSE CAST(timestamp AS INTEGER)
        END
        WHERE typeof(timestamp) = 'text'
      `)
      .run();
  }
};

type Scope = keyof typeof ACTIVITY_TABLES;

class DB {
  static async cleanData() {
    sqlite.exec(`
      DROP TABLE IF EXISTS daily_records;
      DROP TABLE IF EXISTS hourly_records;
      DROP TABLE IF EXISTS minute_records;
      DROP TABLE IF EXISTS foreground_daily_records;
      DROP TABLE IF EXISTS foreground_hourly_records;
      DROP TABLE IF EXISTS foreground_minute_records;
      DROP TABLE IF EXISTS background_daily_records;
      DROP TABLE IF EXISTS background_hourly_records;
      DROP TABLE IF EXISTS background_minute_records;
      DROP TABLE IF EXISTS marked_programs;
    `);
    sqlite.exec('VACUUM;');
    ensureSchema();
  }

  static async sync() {
    try {
      ensureSchema();
      migrateTimestampColumns();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }

  static async incrementActivityRecord(params: {
    scope: Scope;
    timestamp: Date | number | string;
    program: string;
    event: string;
    seconds: number;
  }) {
    const table = ACTIVITY_TABLES[params.scope];
    const timestamp = normalizeTimestampInput(params.timestamp);
    const createdAt = new Date().toISOString();
    const existing = db
      .select()
      .from(table)
      .where(
        and(
          eq(table.timestamp, timestamp),
          eq(table.program, params.program),
          eq(table.event, params.event)
        )
      )
      .get();
    if (existing) {
      db.update(table)
        .set({
          seconds: Number(existing.seconds ?? 0) + params.seconds,
          event: params.event,
        })
        .where(eq(table.id, existing.id))
        .run();
      return;
    }
    db.insert(table)
      .values({
        timestamp,
        program: params.program,
        event: params.event,
        seconds: params.seconds,
        createdAt,
      })
      .run();
  }

  static async incrementForegroundRecord(params: {
    scope: Scope;
    timestamp: Date | number | string;
    program: string;
    seconds: number;
  }) {
    const table = FOREGROUND_TABLES[params.scope];
    const timestamp = normalizeTimestampInput(params.timestamp);
    const createdAt = new Date().toISOString();
    const existing = db
      .select()
      .from(table)
      .where(
        and(eq(table.timestamp, timestamp), eq(table.program, params.program))
      )
      .get();
    if (existing) {
      db.update(table)
        .set({
          seconds: Number(existing.seconds ?? 0) + params.seconds,
        })
        .where(eq(table.id, existing.id))
        .run();
      return;
    }
    db.insert(table)
      .values({
        timestamp,
        program: params.program,
        seconds: params.seconds,
        createdAt,
      })
      .run();
  }

  static async incrementBackgroundRecord(params: {
    scope: Scope;
    timestamp: Date | number | string;
    program: string;
    seconds: number;
  }) {
    const table = BACKGROUND_TABLES[params.scope];
    const timestamp = normalizeTimestampInput(params.timestamp);
    const createdAt = new Date().toISOString();
    const existing = db
      .select()
      .from(table)
      .where(
        and(eq(table.timestamp, timestamp), eq(table.program, params.program))
      )
      .get();
    if (existing) {
      db.update(table)
        .set({
          seconds: Number(existing.seconds ?? 0) + params.seconds,
        })
        .where(eq(table.id, existing.id))
        .run();
      return;
    }
    db.insert(table)
      .values({
        timestamp,
        program: params.program,
        seconds: params.seconds,
        createdAt,
      })
      .run();
  }

  static async getMinuteRecords(duration: number) {
    const cutoff = Date.now() - duration;
    return db
      .select()
      .from(minuteRecords)
      .where(gte(minuteRecords.timestamp, cutoff))
      .all()
      .map((record) => ({
        ...record,
        timestamp: normalizeTimestampOutput(record.timestamp),
      }));
  }

  static async getHourlyRecords(duration: number) {
    const cutoff = Date.now() - duration;
    return db
      .select()
      .from(hourlyRecords)
      .where(gte(hourlyRecords.timestamp, cutoff))
      .all()
      .map((record) => ({
        ...record,
        timestamp: normalizeTimestampOutput(record.timestamp),
      }));
  }

  static async getDailyRcords(duration: number) {
    const cutoff = Date.now() - duration;
    const data = db
      .select()
      .from(dailyRecords)
      .where(gte(dailyRecords.timestamp, cutoff))
      .all();
    const offset = new Date().getTimezoneOffset() * 60 * 1000;
    return data.map((record) => ({
      ...record,
      timestamp: new Date(normalizeTimestampOutput(record.timestamp) + offset),
    }));
  }

  static async getForegroundMinuteRecords(duration: number) {
    const cutoff = Date.now() - duration;
    return db
      .select()
      .from(foregroundMinuteRecords)
      .where(gte(foregroundMinuteRecords.timestamp, cutoff))
      .all()
      .map((record) => ({
        ...record,
        timestamp: normalizeTimestampOutput(record.timestamp),
      }));
  }

  static async getForegroundHourlyRecords(duration: number) {
    const cutoff = Date.now() - duration;
    return db
      .select()
      .from(foregroundHourlyRecords)
      .where(gte(foregroundHourlyRecords.timestamp, cutoff))
      .all()
      .map((record) => ({
        ...record,
        timestamp: normalizeTimestampOutput(record.timestamp),
      }));
  }

  static async getForegroundDailyRecords(duration: number) {
    const cutoff = Date.now() - duration;
    const data = db
      .select()
      .from(foregroundDailyRecords)
      .where(gte(foregroundDailyRecords.timestamp, cutoff))
      .all();
    const offset = new Date().getTimezoneOffset() * 60 * 1000;
    return data.map((record) => ({
      ...record,
      timestamp: new Date(normalizeTimestampOutput(record.timestamp) + offset),
    }));
  }

  static async getBackgroundMinuteRecords(duration: number) {
    const cutoff = Date.now() - duration;
    return db
      .select()
      .from(backgroundMinuteRecords)
      .where(gte(backgroundMinuteRecords.timestamp, cutoff))
      .all()
      .map((record) => ({
        ...record,
        timestamp: normalizeTimestampOutput(record.timestamp),
      }));
  }

  static async getBackgroundHourlyRecords(duration: number) {
    const cutoff = Date.now() - duration;
    return db
      .select()
      .from(backgroundHourlyRecords)
      .where(gte(backgroundHourlyRecords.timestamp, cutoff))
      .all()
      .map((record) => ({
        ...record,
        timestamp: normalizeTimestampOutput(record.timestamp),
      }));
  }

  static async getBackgroundDailyRecords(duration: number) {
    const cutoff = Date.now() - duration;
    const data = db
      .select()
      .from(backgroundDailyRecords)
      .where(gte(backgroundDailyRecords.timestamp, cutoff))
      .all();
    const offset = new Date().getTimezoneOffset() * 60 * 1000;
    return data.map((record) => ({
      ...record,
      timestamp: new Date(normalizeTimestampOutput(record.timestamp) + offset),
    }));
  }

  static async listForegroundPrograms() {
    const rows = sqlite
      .prepare(
        `
        SELECT DISTINCT program FROM foreground_minute_records
        UNION
        SELECT DISTINCT program FROM foreground_hourly_records
        UNION
        SELECT DISTINCT program FROM foreground_daily_records
      `
      )
      .all() as { program: string | null }[];
    return rows
      .map((row) => String(row.program ?? '').trim())
      .filter(Boolean);
  }

  static async listMarkedPrograms() {
    const rows = sqlite
      .prepare('SELECT DISTINCT program FROM marked_programs')
      .all() as { program: string | null }[];
    return rows
      .map((row) => String(row.program ?? '').trim())
      .filter(Boolean);
  }

  static async addMarkedProgram(program: string) {
    const trimmed = program.trim();
    if (!trimmed) {
      return;
    }
    sqlite
      .prepare('INSERT OR IGNORE INTO marked_programs (program) VALUES (?)')
      .run(trimmed);
  }

  static async removeMarkedProgram(program: string) {
    const trimmed = program.trim();
    if (!trimmed) {
      return;
    }
    sqlite
      .prepare('DELETE FROM marked_programs WHERE program = ?')
      .run(trimmed);
  }
}

export { DB };
