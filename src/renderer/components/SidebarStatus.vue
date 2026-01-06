<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="!collapsed"
      class="text-[10px] uppercase tracking-[0.3em] text-muted"
    >
      {{ t('sidebar.activeApp') }}
    </div>
    <div v-if="collapsed" class="flex items-center gap-2 text-xs">
      <UIcon name="i-lucide-activity" class="h-4 w-4 text-muted" />
    </div>
    <div v-else class="space-y-2 text-xs">
      <div v-if="!status.available" class="text-muted">
        {{ t('status.activityUnavailable') }}
      </div>
      <div v-else-if="!items.length" class="text-muted">
        {{ emptyMessage }}
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="item in items"
          :key="item.program"
          class="flex items-center gap-2"
        >
          <div class="h-2 w-2 rounded-full bg-current" />
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">
              {{ item.program }}
            </div>
            <div class="truncate text-[11px] text-muted">
              {{ timeLabel(item.seconds) }}
            </div>
          </div>
        </div>
      </div>
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
import { useI18n } from 'vue-i18n';
import { formatDuration } from '@/utils/format';

const { collapsed } = defineProps<{ collapsed?: boolean }>();
const electron = useElectron();
const { t } = useI18n();

type MarkedApp = { program: string; seconds: number };

const status = ref<{
  available: boolean;
  items: MarkedApp[];
  markedCount: number;
}>({
  available: false,
  items: [],
  markedCount: 0,
});

const normalizeItems = (items: unknown): MarkedApp[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as { program?: unknown; seconds?: unknown };
      const program =
        typeof record.program === 'string' ? record.program.trim() : '';
      if (!program) {
        return null;
      }
      const seconds = Number(record.seconds ?? 0);
      return {
        program,
        seconds: Number.isFinite(seconds) ? Math.max(0, seconds) : 0,
      };
    })
    .filter((item): item is MarkedApp => Boolean(item));
};

const items = computed(() => status.value.items);
const emptyMessage = computed(() =>
  status.value.markedCount > 0
    ? t('sidebar.markedInactive')
    : t('sidebar.markedEmpty')
);

const timeLabel = (seconds: number) =>
  t('status.running', { duration: formatDuration(seconds) });

const refreshStatus = async () => {
  if (!electron) {
    status.value = { available: false, items: [], markedCount: 0 };
    return;
  }
  try {
    const data = await electron.invoke('get-marked-running-programs');
    status.value = {
      available: Boolean(data?.available),
      items: normalizeItems(data?.items),
      markedCount: Number(data?.markedCount ?? 0),
    };
  } catch {
    status.value = { available: false, items: [], markedCount: 0 };
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
