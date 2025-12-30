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

const MOJIBAKE_MARKERS = ['Ã', 'Â', 'â'];

function decodeWithEncoding(bytes: Buffer, encoding: string) {
  if (encoding === 'utf8') {
    return bytes.toString('utf8');
  }
  return iconv.decode(bytes, encoding);
}

function looksUtf16Le(bytes: Buffer) {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return true;
  }
  let evenZeros = 0;
  let oddZeros = 0;
  const sampleSize = Math.min(bytes.length, 64);
  for (let i = 0; i < sampleSize; i += 1) {
    if (bytes[i] === 0) {
      if (i % 2 === 0) {
        evenZeros += 1;
      } else {
        oddZeros += 1;
      }
    }
  }
  return oddZeros > evenZeros * 2 && oddZeros > 2;
}

function countBadChars(text: string) {
  let penalty = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0xfffd) {
      penalty += 3;
      continue;
    }
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
      penalty += 1;
    }
  }
  for (const marker of MOJIBAKE_MARKERS) {
    if (text.includes(marker)) {
      penalty += 1;
    }
  }
  return penalty;
}

function chooseBestDecoded(bytes: Buffer, original: string) {
  let bestText = original;
  let bestPenalty = countBadChars(original);
  for (const encoding of ENCODING_CANDIDATES) {
    const decoded = decodeWithEncoding(bytes, encoding);
    const penalty = countBadChars(decoded);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
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
    if (looksUtf16Le(value)) {
      return decodeWithEncoding(value, 'utf16le').replace(/^\uFEFF/, '');
    }
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
