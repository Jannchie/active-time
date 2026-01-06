import { i18n } from '@/i18n';

const t = (key: string, params?: Record<string, number | string>) =>
  params ? i18n.global.t(key, params) : i18n.global.t(key);

export const formatBytes = (size?: number | null) => {
  if (size === undefined || size === null || Number.isNaN(size)) {
    return '--';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export const formatDuration = (seconds?: number | null) => {
  if (!seconds || Number.isNaN(seconds)) {
    return t('time.seconds', { seconds: 0 });
  }
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const remainder = Math.floor(seconds % 60);

  if (hours > 0) {
    return t('time.hoursMinutes', { hours, minutes });
  }
  if (minutes > 0) {
    return t('time.minutesSeconds', { minutes, seconds: remainder });
  }
  return t('time.seconds', { seconds: remainder });
};

export const formatTimestamp = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleString(i18n.global.locale.value);
};
