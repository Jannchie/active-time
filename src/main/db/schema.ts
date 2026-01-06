import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const dailyRecords = sqliteTable('daily_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program'),
  event: text('event'),
  timestamp: integer('timestamp').notNull(),
  seconds: integer('seconds').notNull(),
  createdAt: text('createdAt'),
});

export const hourlyRecords = sqliteTable('hourly_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program'),
  event: text('event'),
  timestamp: integer('timestamp').notNull(),
  seconds: integer('seconds').notNull(),
  createdAt: text('createdAt'),
});

export const minuteRecords = sqliteTable('minute_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program'),
  event: text('event'),
  timestamp: integer('timestamp').notNull(),
  seconds: integer('seconds').notNull(),
  createdAt: text('createdAt'),
});

export const foregroundDailyRecords = sqliteTable('foreground_daily_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program'),
  timestamp: integer('timestamp').notNull(),
  seconds: integer('seconds').notNull(),
  createdAt: text('createdAt'),
});

export const foregroundHourlyRecords = sqliteTable('foreground_hourly_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program'),
  timestamp: integer('timestamp').notNull(),
  seconds: integer('seconds').notNull(),
  createdAt: text('createdAt'),
});

export const foregroundMinuteRecords = sqliteTable('foreground_minute_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program'),
  timestamp: integer('timestamp').notNull(),
  seconds: integer('seconds').notNull(),
  createdAt: text('createdAt'),
});

export const backgroundDailyRecords = sqliteTable('background_daily_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program'),
  timestamp: integer('timestamp').notNull(),
  seconds: integer('seconds').notNull(),
  createdAt: text('createdAt'),
});

export const backgroundHourlyRecords = sqliteTable(
  'background_hourly_records',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    program: text('program'),
    timestamp: integer('timestamp').notNull(),
    seconds: integer('seconds').notNull(),
    createdAt: text('createdAt'),
  }
);

export const backgroundMinuteRecords = sqliteTable(
  'background_minute_records',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    program: text('program'),
    timestamp: integer('timestamp').notNull(),
    seconds: integer('seconds').notNull(),
    createdAt: text('createdAt'),
  }
);

export const markedPrograms = sqliteTable('marked_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  program: text('program').notNull(),
  createdAt: text('createdAt'),
});
