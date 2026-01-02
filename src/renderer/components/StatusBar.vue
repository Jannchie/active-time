<template>
  <footer
    class="status-bar flex flex-wrap items-center justify-between gap-3 px-3 py-2"
  >
    <div class="flex items-center gap-3">
      <UButton
        color="neutral"
        :variant="recording ? 'solid' : 'soft'"
        size="xs"
        class="rounded-full"
        @click="toggleRecording"
      >
        {{ recording ? 'Recording' : 'Paused' }}
      </UButton>
      <UBadge color="neutral" variant="soft">
        Storage {{ formatBytes(storageSize) }}
      </UBadge>
    </div>
    <div class="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted">
      <UIcon name="i-lucide-activity" class="h-4 w-4" />
      <div class="min-w-0">
        <div class="truncate">
          Active: {{ activeLabel }}
        </div>
        <div class="truncate text-[11px]">
          {{ activeTimeLabel }}
        </div>
      </div>
    </div>
    <div class="flex items-center gap-3 text-xs text-muted">
      <span>Sample {{ checkInterval }}s</span>
      <span class="hidden sm:inline">
        Focus stays local. Data never leaves this device.
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { formatBytes } from '@/utils/format';
import { useElectron } from '@/composables/useElectron';
import { useCheckInterval } from '@/composables/useCheckInterval';

const electron = useElectron();
const recording = ref(true);
const storageSize = ref<number | null>(null);
let stopListener: (() => void) | undefined;
const { checkInterval } = useCheckInterval();
const activeStatus = ref<{
  available: boolean;
  program?: string;
  since?: number;
}>({
  available: false,
});

const refreshStorage = async () => {
  if (!electron) {
    return;
  }
  try {
    const size = await electron.invoke('get-db-file-size');
    storageSize.value = Number(size);
  } catch {
    storageSize.value = null;
  }
};

const storageInterval = useIntervalFn(refreshStorage, 5000, {
  immediate: false,
});

const formatSince = (value?: number) => {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const activeLabel = computed(() => {
  if (!activeStatus.value.available) {
    return 'Activity unavailable';
  }
  return activeStatus.value.program || 'No active app';
});

const activeTimeLabel = computed(() => {
  if (!activeStatus.value.available || !activeStatus.value.since) {
    return 'Started --';
  }
  return `Started ${formatSince(activeStatus.value.since)}`;
});

const refreshActiveStatus = async () => {
  if (!electron) {
    activeStatus.value = { available: false };
    return;
  }
  try {
    const data = await electron.invoke('get-active-window');
    activeStatus.value = {
      available: Boolean(data?.available),
      program: data?.program,
      since: typeof data?.since === 'number' ? data.since : undefined,
    };
  } catch {
    activeStatus.value = { available: false };
  }
};

const activeInterval = useIntervalFn(refreshActiveStatus, 5000, {
  immediate: false,
});

const toggleRecording = () => {
  if (!electron) {
    return;
  }
  const next = !recording.value;
  electron.invoke('toggle-record', next);
  recording.value = next;
};

onMounted(() => {
  if (!electron) {
    return;
  }

  electron.invoke('toggle-record', true);
  stopListener = electron.on('recording-changed', (val) => {
    recording.value = Boolean(val);
  });

  refreshStorage();
  storageInterval.resume();
  refreshActiveStatus();
  activeInterval.resume();
});

onBeforeUnmount(() => {
  stopListener?.();
  storageInterval.pause();
  activeInterval.pause();
});
</script>
