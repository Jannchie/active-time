<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="!collapsed"
      class="text-[10px] uppercase tracking-[0.3em] text-muted"
    >
      Active App
    </div>
    <div class="flex items-center gap-2 text-xs">
      <div
        class="h-2 w-2 rounded-full bg-current"
        :class="status.available ? 'opacity-100' : 'opacity-40'"
      />
      <div v-if="!collapsed" class="min-w-0 flex-1">
        <div class="truncate font-medium">
          {{ statusLabel }}
        </div>
        <div class="truncate text-[11px] text-muted">
          {{ timeLabel }}
        </div>
      </div>
      <UIcon
        v-else
        name="i-lucide-activity"
        class="h-4 w-4 text-muted"
      />
    </div>
    <div
      v-if="!collapsed"
      class="text-[9px] uppercase tracking-[0.3em] text-muted"
    >
      v0.3
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { useElectron } from '@/composables/useElectron';

const { collapsed } = defineProps<{ collapsed?: boolean }>();
const electron = useElectron();

const status = ref<{
  available: boolean;
  program?: string;
  since?: number;
}>({
  available: false,
});

const formatSince = (value?: number) => {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const statusLabel = computed(() => {
  if (!status.value.available) {
    return 'Activity unavailable';
  }
  return status.value.program || 'No active app';
});

const timeLabel = computed(() => {
  if (!status.value.available || !status.value.since) {
    return 'Started --';
  }
  return `Started ${formatSince(status.value.since)}`;
});

const refreshStatus = async () => {
  if (!electron) {
    status.value = { available: false };
    return;
  }
  try {
    const data = await electron.invoke('get-active-window');
    status.value = {
      available: Boolean(data?.available),
      program: data?.program,
      since: typeof data?.since === 'number' ? data.since : undefined,
    };
  } catch {
    status.value = { available: false };
  }
};

const interval = useIntervalFn(refreshStatus, 5000, { immediate: false });

onMounted(() => {
  refreshStatus();
  interval.resume();
});

onBeforeUnmount(() => {
  interval.pause();
});
</script>
