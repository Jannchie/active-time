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
        {{ recording ? t('status.recording') : t('status.paused') }}
      </UButton>
      <UBadge color="neutral" variant="soft">
        {{ t('status.storage', { size: formatBytes(storageSize) }) }}
      </UBadge>
    </div>
    <div class="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted">
      <UIcon name="i-lucide-activity" class="h-4 w-4" />
      <div class="min-w-0">
        <div class="truncate">
          {{ t('status.active', { label: activeLabel }) }}
        </div>
        <div class="truncate text-[11px]">
          {{ activeTimeLabel }}
        </div>
      </div>
    </div>
    <div class="flex items-center gap-3 text-xs text-muted">
      <span>
        {{ t('status.sample', { seconds: checkInterval, unit: t('common.secondsShort') }) }}
      </span>
      <span class="hidden sm:inline">
        {{ t('status.privacy') }}
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { formatBytes, formatDuration } from '@/utils/format';
import { useElectron } from '@/composables/useElectron';
import { useCheckInterval } from '@/composables/useCheckInterval';
import { useI18n } from 'vue-i18n';

const electron = useElectron();
const recording = ref(true);
const storageSize = ref<number | null>(null);
let stopListener: (() => void) | undefined;
const { checkInterval } = useCheckInterval();
const { t } = useI18n();
const activeStatus = ref<{
  available: boolean;
  program?: string;
  since?: number;
  durationSeconds?: number;
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

const activeLabel = computed(() => {
  if (!activeStatus.value.available) {
    return t('status.activityUnavailable');
  }
  return activeStatus.value.program || t('status.noActiveApp');
});

const activeTimeLabel = computed(() => {
  if (
    !activeStatus.value.available ||
    activeStatus.value.durationSeconds === undefined
  ) {
    return t('status.runningUnknown');
  }
  return t('status.running', {
    duration: formatDuration(activeStatus.value.durationSeconds),
  });
});

const refreshActiveStatus = async () => {
  if (!electron) {
    activeStatus.value = { available: false };
    return;
  }
  try {
    const data = await electron.invoke('get-active-window');
    const since = typeof data?.since === 'number' ? data.since : undefined;
    activeStatus.value = {
      available: Boolean(data?.available),
      program: data?.program,
      since,
      durationSeconds:
        typeof since === 'number'
          ? Math.max(0, Math.floor((Date.now() - since) / 1000))
          : undefined,
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
