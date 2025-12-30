<template>
  <footer class="status-bar flex items-center justify-between px-3 py-2">
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
    <div class="text-xs text-muted">
      Focus stays local. Data never leaves this device.
    </div>
  </footer>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { formatBytes } from '@/utils/format';
import { useElectron } from '@/composables/useElectron';

const electron = useElectron();
const recording = ref(true);
const storageSize = ref<number | null>(null);
let stopListener: (() => void) | undefined;

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

const interval = useIntervalFn(refreshStorage, 5000, { immediate: false });

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
  interval.resume();
});

onBeforeUnmount(() => {
  stopListener?.();
  interval.pause();
});
</script>
