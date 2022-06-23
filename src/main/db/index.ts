import sqlite3 from 'sqlite3';
import { app } from 'electron';
import { Sequelize, DataTypes, Optional, Op } from 'sequelize';
import { MinuteRecord } from './MinuteRecord';

const db = new Sequelize({
  dialect: 'sqlite',
  dialectModule: sqlite3,
  storage: `${app.getPath('userData')}/data.db`,
});
MinuteRecord.init(
  {
    program: DataTypes.STRING,
    title: DataTypes.STRING,
    event: DataTypes.STRING,
    timestamp: DataTypes.DATE,
    seconds: DataTypes.INTEGER,
  },
  { sequelize: db, updatedAt: false }
);
class DB {
  static async cleanData() {
    await db.query('DROP TABLE IF EXISTS "MinuteRecords";');
    await db.sync();
  }

  static async sync() {
    return db.sync();
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
}
export { DB, MinuteRecord };
