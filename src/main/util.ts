/* eslint import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';
import iconv from 'iconv-lite';

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 25123;
  resolveHtmlPath = (htmlFileName: string) => {
    const url = new URL(`http://localhost:${port}`);
    if (htmlFileName && htmlFileName !== 'index.html') {
      url.pathname = htmlFileName;
    }
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
  return new Date(
    new Date(now.toLocaleDateString()).getTime() -
      now.getTimezoneOffset() * 60 * 1000
  );
}

const ENCODING_CANDIDATES = [
  'utf8',
  'gb18030',
  'big5',
  'shift_jis',
  'euc-kr',
  'windows-1252',
] as const;

const MOJIBAKE_MARKERS = new Set([0xfffd, 0x00c3, 0x00c2, 0x00e2]);

function isCjk(code: number) {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x3040 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af)
  );
}

function scoreText(text: string) {
  let score = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0xfffd) {
      score -= 3;
      continue;
    }
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
      score -= 2;
      continue;
    }
    if (isCjk(code)) {
      score += 2;
      continue;
    }
    if (
      (code >= 0x30 && code <= 0x39) ||
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a)
    ) {
      score += 1;
      continue;
    }
    if (code >= 0x80 && code <= 0xff) {
      score += 0.1;
      continue;
    }
    if (' _-.,:;()[]{}\'"/\\|@#%&+*'.includes(ch)) {
      score += 0.2;
      continue;
    }
    score += 0.3;
  }
  let markerCount = 0;
  for (const ch of text) {
    if (MOJIBAKE_MARKERS.has(ch.charCodeAt(0))) {
      markerCount += 1;
    }
  }
  return score - markerCount * 0.5;
}

function decodeWithEncoding(bytes: Buffer, encoding: string) {
  if (encoding === 'utf8') {
    return bytes.toString('utf8');
  }
  return iconv.decode(bytes, encoding);
}

function chooseBestDecoded(bytes: Buffer, original: string) {
  let bestText = original;
  let bestScore = scoreText(original);
  for (const encoding of ENCODING_CANDIDATES) {
    const decoded = decodeWithEncoding(bytes, encoding);
    const score = scoreText(decoded);
    if (score > bestScore + 0.5) {
      bestScore = score;
      bestText = decoded;
    }
  }
  return bestText;
}

export function autoDecodeText(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Buffer.isBuffer(value)) {
    return chooseBestDecoded(value, decodeWithEncoding(value, 'utf8'));
  }
  if (typeof value !== 'string') {
    return String(value);
  }
  if (!value) {
    return value;
  }
  const bytes = Buffer.from(value, 'latin1');
  return chooseBestDecoded(bytes, value);
}
