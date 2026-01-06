<template>
  <div class="space-y-4">
    <section>
      <h1 class="text-xl font-semibold">{{ t('settings.title') }}</h1>
      <p class="text-sm text-muted">
        {{ t('settings.description') }}
      </p>
    </section>

    <section class="panel">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">{{ t('settings.theme.title') }}</h2>
          <p class="text-xs text-muted">
            {{ t('settings.theme.description') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
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
      </div>
    </section>

    <section class="panel">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">{{ t('settings.interval.title') }}</h2>
          <p class="text-xs text-muted">
            {{ t('settings.interval.description') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model.number="intervalInput"
            type="number"
            :min="MIN_CHECK_INTERVAL"
            :max="MAX_CHECK_INTERVAL"
            step="1"
            class="h-9 w-20 rounded-md border border-muted bg-transparent px-2 text-xs text-right"
          >
          <span class="text-xs text-muted">{{ t('common.secondsShort') }}</span>
          <UButton size="xs" color="neutral" variant="solid" @click="applyInterval">
            {{ t('common.apply') }}
          </UButton>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
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
        <span class="text-[11px] text-muted">
          {{ t('common.range', { min: MIN_CHECK_INTERVAL, max: MAX_CHECK_INTERVAL, unit: t('common.secondsShort') }) }}
        </span>
      </div>
    </section>

    <section class="panel">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">{{ t('settings.language.title') }}</h2>
          <p class="text-xs text-muted">
            {{ t('settings.language.description') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
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
      </div>
    </section>

    <section class="panel">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">{{ t('settings.autoStart.title') }}</h2>
          <p class="text-xs text-muted">
            {{ t('settings.autoStart.description') }}
          </p>
        </div>
        <div class="flex gap-2">
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
      </div>
    </section>

    <section class="panel">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">{{ t('settings.danger.title') }}</h2>
          <p class="text-xs text-muted">
            {{ t('settings.danger.description') }}
          </p>
        </div>
        <UButton color="neutral" variant="outline" @click="showModal = true">
          {{ t('settings.danger.action') }}
        </UButton>
      </div>
    </section>

    <UModal v-model="showModal">
      <div class="panel space-y-3">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-triangle-alert" class="h-5 w-5" />
          <h3 class="text-lg font-semibold">{{ t('settings.danger.modalTitle') }}</h3>
        </div>
        <div class="text-sm text-muted">
          {{ t('settings.danger.modalDescription') }}
        </div>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="showModal = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="neutral" variant="solid" @click="confirmWipe">
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
