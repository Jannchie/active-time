<template>
  <div class="flex flex-col gap-3">
    <!-- Toolbar -->
    <section class="flex items-center justify-between gap-2">
      <h1 class="text-sm font-bold tracking-wide">{{ t('settings.title') }}</h1>
    </section>

    <!-- Settings sections -->
    <div class="panel divide-y divide-(--ui-border)">
      <!-- Theme -->
      <section class="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
        <div>
          <h2 class="text-xs font-semibold">{{ t('settings.theme.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('settings.theme.description') }}</p>
        </div>
        <div class="segmented">
          <button
            type="button"
            class="segmented-item"
            :data-active="theme === 'dark'"
            @click="emit('update:theme', 'dark')"
          >
            {{ t('common.dark') }}
          </button>
          <button
            type="button"
            class="segmented-item"
            :data-active="theme === 'light'"
            @click="emit('update:theme', 'light')"
          >
            {{ t('common.light') }}
          </button>
          <button
            type="button"
            class="segmented-item"
            :data-active="theme === 'system'"
            @click="emit('update:theme', 'system')"
          >
            {{ t('common.system') }}
          </button>
        </div>
      </section>

      <!-- Interval -->
      <section class="px-3 py-2.5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xs font-semibold">{{ t('settings.interval.title') }}</h2>
            <p class="mt-0.5 text-xs text-muted">{{ t('settings.interval.description') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="intervalInput"
              type="number"
              :min="MIN_CHECK_INTERVAL"
              :max="MAX_CHECK_INTERVAL"
              step="1"
              class="h-6 w-16 rounded-md border border-(--ui-border) bg-(--ui-bg-muted) px-2 text-right text-xs tabular-nums focus:border-(--ui-border-accented) focus:outline-none"
            >
            <span class="text-xs text-muted">{{ t('common.secondsShort') }}</span>
            <UButton size="xs" color="neutral" variant="solid" @click="applyInterval">
              {{ t('common.apply') }}
            </UButton>
          </div>
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <div class="segmented">
            <button
              v-for="preset in intervalPresets"
              :key="preset"
              type="button"
              class="segmented-item"
              :data-active="intervalInput === preset"
              @click="applyPreset(preset)"
            >
              {{ preset }}{{ t('common.secondsShort') }}
            </button>
          </div>
          <span class="text-xs text-muted">
            {{ t('common.range', { min: MIN_CHECK_INTERVAL, max: MAX_CHECK_INTERVAL, unit: t('common.secondsShort') }) }}
          </span>
        </div>
      </section>

      <!-- Language -->
      <section class="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
        <div>
          <h2 class="text-xs font-semibold">{{ t('settings.language.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('settings.language.description') }}</p>
        </div>
        <div class="segmented">
          <button
            v-for="option in localeOptions"
            :key="option.value"
            type="button"
            class="segmented-item"
            :data-active="locale === option.value"
            @click="setAppLocale(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <!-- Auto Start -->
      <section class="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
        <div>
          <h2 class="text-xs font-semibold">{{ t('settings.autoStart.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('settings.autoStart.description') }}</p>
        </div>
        <div class="segmented">
          <button
            type="button"
            class="segmented-item"
            :data-active="loginSettings?.openAtLogin === true"
            @click="setAutoStart(true)"
          >
            {{ t('common.enabled') }}
          </button>
          <button
            type="button"
            class="segmented-item"
            :data-active="loginSettings?.openAtLogin === false"
            @click="setAutoStart(false)"
          >
            {{ t('common.disabled') }}
          </button>
        </div>
      </section>

      <!-- Danger zone -->
      <section class="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
        <div>
          <h2 class="text-xs font-semibold text-red-500">{{ t('settings.danger.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('settings.danger.description') }}</p>
        </div>
        <UButton color="error" variant="outline" size="xs" @click="showModal = true">
          {{ t('settings.danger.action') }}
        </UButton>
      </section>
    </div>

    <!-- Modal -->
    <UModal v-model:open="showModal">
      <template #content>
        <div class="space-y-3 p-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-triangle-alert" class="h-4 w-4 text-red-500" />
            <h3 class="text-xs font-semibold">{{ t('settings.danger.modalTitle') }}</h3>
          </div>
          <p class="text-xs text-muted">{{ t('settings.danger.modalDescription') }}</p>
          <div class="flex justify-end gap-2 pt-1">
            <UButton variant="ghost" color="neutral" size="xs" @click="showModal = false">
              {{ t('common.cancel') }}
            </UButton>
            <UButton color="error" variant="solid" size="xs" @click="confirmWipe">
              {{ t('common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useElectron } from '@/composables/useElectron';
import { useCheckInterval } from '@/composables/useCheckInterval';
import { setLocale } from '@/i18n';
import type { AppLocale } from '@/i18n';
import { useI18n } from 'vue-i18n';

type LoginItemSettings = {
  executableWillLaunchAtLogin: boolean;
  launchItems: unknown[];
  openAsHidden: boolean;
  openAtLogin: boolean;
  restoreState: boolean;
  wasOpenedAsHidden: boolean;
  wasOpenedAtLogin: boolean;
};

type ThemeMode = 'dark' | 'light' | 'system';

defineProps<{ theme: ThemeMode }>();
const emit = defineEmits<{ (e: 'update:theme', value: ThemeMode): void }>();

const electron = useElectron();
const { t, locale } = useI18n();
const loginSettings = ref<LoginItemSettings | null>(null);
const showModal = ref(false);
let stopListener: (() => void) | undefined;
const { checkInterval, setCheckInterval } = useCheckInterval();
const MIN_CHECK_INTERVAL = 1;
const MAX_CHECK_INTERVAL = 60;
const intervalPresets = [1, 2, 5, 10, 15];
const intervalInput = ref(checkInterval.value);

const localeOptions = computed(() => [
  { value: 'en' as AppLocale, label: t('language.english') },
  { value: 'zh-CN' as AppLocale, label: t('language.simplifiedChinese') },
]);

const setAppLocale = (value: AppLocale) => {
  setLocale(value);
};

const setAutoStart = async (value: boolean) => {
  if (!electron) {
    return;
  }
  await electron.invoke('set-login-settings', value);
};

const confirmWipe = async () => {
  if (!electron) {
    return;
  }
  await electron.invoke('clean-db-data');
  showModal.value = false;
};

const applyInterval = async () => {
  await setCheckInterval(intervalInput.value);
  if (typeof window !== 'undefined') {
    localStorage.setItem('checkInterval', String(checkInterval.value));
  }
  intervalInput.value = checkInterval.value;
};

const applyPreset = async (value: number) => {
  intervalInput.value = value;
  await applyInterval();
};

onMounted(async () => {
  if (!electron) {
    return;
  }
  await electron.invoke('get-login-item-settings');
  stopListener = electron.on('login-item-setting-changed', (val) => {
    loginSettings.value = val as LoginItemSettings;
  });
});

watch(checkInterval, (value) => {
  intervalInput.value = value;
});

onBeforeUnmount(() => {
  stopListener?.();
});
</script>
