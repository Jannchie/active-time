<template>
  <div class="space-y-6 py-5">
    <!-- Header -->
    <section>
      <h1 class="text-lg font-semibold">{{ t('settings.title') }}</h1>
      <p class="mt-0.5 text-sm text-muted">{{ t('settings.description') }}</p>
    </section>

    <!-- Settings sections -->
    <div class="divide-y divide-(--ui-border) rounded-xl border border-(--ui-border)">
      <!-- Theme -->
      <section class="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 class="text-sm font-semibold">{{ t('settings.theme.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('settings.theme.description') }}</p>
        </div>
        <div class="flex gap-1">
          <UButton
            size="xs"
            :variant="theme === 'dark' ? 'solid' : 'ghost'"
            color="neutral"
            @click="emit('update:theme', 'dark')"
          >
            {{ t('common.dark') }}
          </UButton>
          <UButton
            size="xs"
            :variant="theme === 'light' ? 'solid' : 'ghost'"
            color="neutral"
            @click="emit('update:theme', 'light')"
          >
            {{ t('common.light') }}
          </UButton>
          <UButton
            size="xs"
            :variant="theme === 'system' ? 'solid' : 'ghost'"
            color="neutral"
            @click="emit('update:theme', 'system')"
          >
            {{ t('common.system') }}
          </UButton>
        </div>
      </section>

      <!-- Interval -->
      <section class="p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold">{{ t('settings.interval.title') }}</h2>
            <p class="mt-0.5 text-xs text-muted">{{ t('settings.interval.description') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="intervalInput"
              type="number"
              :min="MIN_CHECK_INTERVAL"
              :max="MAX_CHECK_INTERVAL"
              step="1"
              class="h-8 w-20 rounded-lg border border-(--ui-border) bg-transparent px-2 text-xs tabular-nums text-right focus:border-(--ui-border-active) focus:outline-none"
            >
            <span class="text-xs text-muted">{{ t('common.secondsShort') }}</span>
            <UButton size="xs" color="neutral" variant="solid" @click="applyInterval">
              {{ t('common.apply') }}
            </UButton>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-1">
          <UButton
            v-for="preset in intervalPresets"
            :key="preset"
            size="xs"
            color="neutral"
            :variant="intervalInput === preset ? 'solid' : 'ghost'"
            @click="applyPreset(preset)"
          >
            {{ preset }}{{ t('common.secondsShort') }}
          </UButton>
          <span class="ml-2 text-[11px] text-muted">
            {{ t('common.range', { min: MIN_CHECK_INTERVAL, max: MAX_CHECK_INTERVAL, unit: t('common.secondsShort') }) }}
          </span>
        </div>
      </section>

      <!-- Language -->
      <section class="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 class="text-sm font-semibold">{{ t('settings.language.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('settings.language.description') }}</p>
        </div>
        <div class="flex gap-1">
          <UButton
            v-for="option in localeOptions"
            :key="option.value"
            size="xs"
            :variant="locale === option.value ? 'solid' : 'ghost'"
            color="neutral"
            @click="setAppLocale(option.value)"
          >
            {{ option.label }}
          </UButton>
        </div>
      </section>

      <!-- Auto Start -->
      <section class="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 class="text-sm font-semibold">{{ t('settings.autoStart.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('settings.autoStart.description') }}</p>
        </div>
        <div class="flex gap-1">
          <UButton
            size="xs"
            :variant="loginSettings?.openAtLogin ? 'solid' : 'ghost'"
            color="neutral"
            @click="setAutoStart(true)"
          >
            {{ t('common.enabled') }}
          </UButton>
          <UButton
            size="xs"
            :variant="loginSettings?.openAtLogin === false ? 'solid' : 'ghost'"
            color="neutral"
            @click="setAutoStart(false)"
          >
            {{ t('common.disabled') }}
          </UButton>
        </div>
      </section>

      <!-- Danger zone -->
      <section class="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 class="text-sm font-semibold text-red-500">{{ t('settings.danger.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('settings.danger.description') }}</p>
        </div>
        <UButton color="error" variant="outline" size="xs" @click="showModal = true">
          {{ t('settings.danger.action') }}
        </UButton>
      </section>
    </div>

    <!-- Modal -->
    <UModal v-model="showModal">
      <div class="space-y-4 p-5">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-triangle-alert" class="h-5 w-5 text-red-500" />
          <h3 class="text-sm font-semibold">{{ t('settings.danger.modalTitle') }}</h3>
        </div>
        <p class="text-sm text-muted">{{ t('settings.danger.modalDescription') }}</p>
        <div class="flex justify-end gap-2 pt-1">
          <UButton variant="ghost" color="neutral" size="sm" @click="showModal = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="error" variant="solid" size="sm" @click="confirmWipe">
            {{ t('common.delete') }}
          </UButton>
        </div>
      </div>
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
