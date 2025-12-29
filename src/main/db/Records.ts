import { Model } from 'sequelize';

export class DailyRecord extends Model {
  declare seconds: number;

  declare timestamp: string | Date;
}
export class HourlyRecord extends Model {
  declare seconds: number;
}
export class MinuteRecord extends Model {
  declare seconds: number;

  declare title: string;

  declare event: string;

  declare program: string;

  declare timestamp: Date | string;
}

export class ForegroundDailyRecord extends Model {
  declare seconds: number;

  declare program: string;

  declare timestamp: Date | string;
}

export class ForegroundHourlyRecord extends Model {
  declare seconds: number;

  declare program: string;

  declare timestamp: Date | string;
}

export class ForegroundMinuteRecord extends Model {
  declare seconds: number;

  declare program: string;

  declare timestamp: Date | string;
}
