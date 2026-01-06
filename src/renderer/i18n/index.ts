import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

const messages = {
  en,
  'zh-CN': zhCN,
} as const;

export type AppLocale = keyof typeof messages;

const normalizeLocale = (value?: string | null): AppLocale => {
  if (!value) {
    return 'en';
  }
  const normalized = value.toLowerCase();
  if (normalized.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en';
};

const resolveInitialLocale = (): AppLocale => {
  if (typeof window === 'undefined') {
    return 'en';
  }
  const stored = localStorage.getItem('locale');
  if (stored && stored in messages) {
    return stored as AppLocale;
  }
  const browser = navigator.languages?.[0] ?? navigator.language;
  return normalizeLocale(browser);
};

const initialLocale = resolveInitialLocale();

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages,
});

const applyLocale = (locale: AppLocale, persist = true) => {
  i18n.global.locale.value = locale;
  if (typeof window !== 'undefined') {
    document.documentElement.lang = locale;
    if (persist) {
      localStorage.setItem('locale', locale);
    }
  }
};

applyLocale(initialLocale, false);

export const setLocale = (locale: AppLocale) => {
  if (locale === i18n.global.locale.value) {
    return;
  }
  applyLocale(locale);
};
