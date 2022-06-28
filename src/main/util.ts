/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 25123;
  resolveHtmlPath = (htmlFileName: string) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName: string) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
  };
}

export function getCurMinute(now: Date) {
  return new Date(now.getTime() - (now.getTime() % (1000 * 60)));
}

export function getCurHour(now: Date) {
  return new Date(now.getTime() - (now.getTime() % (1000 * 60 * 60)));
}

export function getCurDay(now: Date) {
  return new Date(now.getTime() - (now.getTime() % (1000 * 60 * 60 * 24)));
}
