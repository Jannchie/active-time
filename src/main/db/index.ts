import sqlite3 from 'sqlite3';
import { app } from 'electron';
import { Sequelize, Model, DataTypes } from 'sequelize';

const db = new Sequelize({
  dialect: 'sqlite',
  dialectModule: sqlite3,
  storage: `${app.getPath('userData')}/data.db`,
});
class MinuteRecord extends Model {}
MinuteRecord.init(
  {
    program: DataTypes.STRING,
    title: DataTypes.STRING,
    event: DataTypes.STRING,
    timestamp: DataTypes.DATE,
    seconds: DataTypes.INTEGER,
  },
  { sequelize: db }
);

export { db, MinuteRecord };
