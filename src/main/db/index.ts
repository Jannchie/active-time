import sqlite3 from 'sqlite3';
import { app } from 'electron';
import { Sequelize, DataTypes, Optional, Op, Transaction } from 'sequelize';
import { DailyRecord, HourlyRecord, MinuteRecord } from './Records';

const db = new Sequelize({
  dialect: 'sqlite',
  dialectModule: sqlite3,
  storage: `${app.getPath('userData')}/data.db`,
  transactionType: Transaction.TYPES.IMMEDIATE,
  logging: false,
});

function initModels() {
  const models = [DailyRecord, HourlyRecord, MinuteRecord];
  const nameTable = ['daily_records', 'hourly_records', 'minute_records'];
  for (let i = 0; i < models.length; i += 1) {
    models[i].init(
      {
        program: DataTypes.STRING,
        title: DataTypes.STRING,
        event: DataTypes.STRING,
        timestamp: DataTypes.DATE,
        seconds: DataTypes.INTEGER,
      },
      {
        sequelize: db,
        updatedAt: false,
        indexes: [
          {
            fields: ['timestamp', 'program', 'title'],
          },
        ],
        tableName: nameTable[i],
      }
    );
  }
}

class DB {
  static async cleanData() {
    await db.dropAllSchemas({ logging: true });
    await db.query('VACUUM;');
    await db.sync();
  }

  static async sync() {
    try {
      await db.query('PRAGMA journal_mode=WAL;');
      initModels();
      await db.sync();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }

  static async addDailyRecord(record: Optional<any, string> | undefined) {
    await HourlyRecord.create(record);
  }

  static async addHourlyRecord(record: Optional<any, string> | undefined) {
    await DailyRecord.create(record);
  }

  static async addMinuteRecord(record: Optional<any, string> | undefined) {
    await MinuteRecord.create(record);
  }

  static async getMinuteRecords(duration: number) {
    return MinuteRecord.findAll({
      raw: true,
      where: { timestamp: { [Op.gte]: new Date().getTime() - duration } },
    });
  }

  static async getHourlyRecords(duration: number) {
    return HourlyRecord.findAll({
      raw: true,
      where: { timestamp: { [Op.gte]: new Date().getTime() - duration } },
    });
  }

  static async getDailyRcords(duration: number) {
    const data = await DailyRecord.findAll({
      raw: true,
      where: { timestamp: { [Op.gte]: new Date().getTime() - duration } },
    });
    const offset = new Date().getTimezoneOffset() * 60 * 1000;
    data.forEach((d) => {
      d.timestamp = new Date(new Date(d.timestamp).getTime() + offset);
    });
    return data;
  }
}
export { DB, MinuteRecord, HourlyRecord, DailyRecord };
