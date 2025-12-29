<template>
  <div class="space-y-4">
    <section>
      <h1 class="text-xl font-semibold">Studio Settings</h1>
      <p class="text-sm text-[var(--app-muted)]">
        Tune the workspace ambience and startup behavior.
      </p>
    </section>

    <section class="panel">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">Theme</h2>
          <p class="text-xs text-[var(--app-muted)]">
            Pick a mood for the dashboard.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            size="xs"
            :variant="theme === 'dark' ? 'solid' : 'ghost'"
            color="neutral"
            @click="emit('update:theme', 'dark')"
          >
            Dark
          </UButton>
          <UButton
            size="xs"
            :variant="theme === 'light' ? 'solid' : 'ghost'"
            color="neutral"
            @click="emit('update:theme', 'light')"
          >
            Light
          </UButton>
          <UButton
            size="xs"
            :variant="theme === 'system' ? 'solid' : 'ghost'"
            color="neutral"
            @click="emit('update:theme', 'system')"
          >
            System
          </UButton>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">Auto Start</h2>
          <p class="text-xs text-[var(--app-muted)]">
            Launch Active Time when your system boots.
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            size="xs"
            :variant="loginSettings?.openAtLogin ? 'solid' : 'ghost'"
            color="neutral"
            @click="setAutoStart(true)"
          >
            Enabled
          </UButton>
          <UButton
            size="xs"
            :variant="loginSettings?.openAtLogin === false ? 'solid' : 'ghost'"
            color="neutral"
            @click="setAutoStart(false)"
          >
            Disabled
          </UButton>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-[var(--app-text)]">Danger Zone</h2>
          <p class="text-xs text-[var(--app-muted)]">
            Reset all locally stored activity data.
          </p>
        </div>
        <UButton color="neutral" variant="outline" @click="showModal = true">
          Wipe Data
        </UButton>
      </div>
    </section>

    <UModal v-model="showModal">
      <div class="panel space-y-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-triangle-alert"
            class="h-5 w-5 text-[var(--app-text)]"
          />
          <h3 class="text-lg font-semibold">Delete all data?</h3>
        </div>
        <div class="text-sm text-[var(--app-muted)]">
          This will permanently remove every activity record stored on this device.
        </div>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="showModal = false">
            Cancel
          </UButton>
          <UButton color="neutral" variant="solid" @click="confirmWipe">
            Delete
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useElectron } from '@/composables/useElectron';

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
const loginSettings = ref<LoginItemSettings | null>(null);
const showModal = ref(false);
let stopListener: (() => void) | undefined;

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

onMounted(async () => {
  if (!electron) {
    return;
  }
  await electron.invoke('get-login-item-settings');
  stopListener = electron.on('login-item-setting-changed', (val) => {
    loginSettings.value = val as LoginItemSettings;
  });
});

onBeforeUnmount(() => {
  stopListener?.();
});
</script>
