<template>
  <div class="flex flex-col gap-3">
    <!-- Toolbar -->
    <section class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-[13px] font-bold tracking-wide">{{ t('dashboard.title') }}</h1>
      <div class="flex items-center gap-2">
        <UIcon
          v-if="isSyncing"
          name="i-lucide-loader"
          class="h-3 w-3 animate-spin text-muted"
        />
        <div class="segmented">
          <button
            v-for="range in ranges"
            :key="range.key"
            type="button"
            class="segmented-item"
            :data-active="activeRange.key === range.key"
            @click="setRange(range)"
          >
            {{ range.label }}
          </button>
        </div>
      </div>
    </section>

    <!-- Metrics -->
    <section class="grid gap-2 md:grid-cols-3">
      <div class="panel p-3">
        <div class="micro-label">{{ t('dashboard.metrics.activeInput') }}</div>
        <div class="mt-2 text-2xl font-bold leading-none tabular-nums">
          {{ formatDuration(totalSeconds) }}
        </div>
        <div class="mt-2 text-[11px] text-muted">{{ activeRange.caption }}</div>
      </div>
      <div class="panel p-3">
        <div class="micro-label">{{ t('dashboard.metrics.foregroundTime') }}</div>
        <div class="mt-2 text-2xl font-bold leading-none tabular-nums text-emerald-500">
          {{ formatDuration(totalForegroundSeconds) }}
        </div>
        <div class="mt-2 text-[11px] text-muted">{{ t('dashboard.metrics.foregroundHint') }}</div>
      </div>
      <div class="panel p-3">
        <div class="micro-label">{{ t('dashboard.metrics.appsSeen') }}</div>
        <div class="mt-2 text-2xl font-bold leading-none tabular-nums">
          {{ uniquePrograms }}
        </div>
        <div class="mt-2 text-[11px] text-muted">{{ t('dashboard.metrics.appsSeenHint') }}</div>
      </div>
    </section>

    <!-- Focus split + Top apps -->
    <section class="grid gap-2 lg:grid-cols-[2fr_3fr]">
      <!-- Focus presence -->
      <div class="panel">
        <header class="panel-header">
          <span class="micro-label">{{ t('dashboard.focusSplit.title') }}</span>
          <span class="text-[11px] tabular-nums text-muted">{{ formatDuration(totalTrackedSeconds) }}</span>
        </header>
        <div class="space-y-2 p-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium">{{ t('common.foreground') }}</span>
            <span class="tabular-nums text-muted">
              {{ formatDuration(totalForegroundSeconds) }} · {{ foregroundPercent }}%
            </span>
          </div>
          <UProgress
            :model-value="foregroundPercent"
            :max="100"
            color="success"
            size="xs"
          />
          <div class="text-[11px] text-muted">
            {{ t('dashboard.focusSplit.activeInputLogged', { duration: formatDuration(totalSeconds) }) }}
          </div>
        </div>
      </div>

      <!-- Top apps -->
      <div class="panel">
        <header class="panel-header">
          <span class="micro-label">{{ t('dashboard.topApps.title') }}</span>
          <span class="text-[11px] tabular-nums text-muted">{{ t('common.top', { count: topPrograms.length }) }}</span>
        </header>
        <div v-if="topPrograms.length" class="divide-y divide-(--ui-border)">
          <div
            v-for="item in topPrograms"
            :key="item.name"
            class="relative flex items-center gap-3 px-3 py-1.5"
          >
            <div
              class="absolute inset-y-0 left-0 bg-emerald-500/10"
              :style="{ width: `${item.percent}%` }"
            />
            <span class="selectable relative min-w-0 flex-1 truncate text-xs font-medium">{{ item.name }}</span>
            <span class="relative shrink-0 text-[11px] tabular-nums text-muted">{{ formatDuration(item.seconds) }}</span>
            <span class="relative w-9 shrink-0 text-right text-[11px] tabular-nums text-muted opacity-60">{{ item.percent }}%</span>
          </div>
        </div>
        <div v-else class="flex flex-col items-center gap-2 px-3 py-6 text-xs text-muted">
          <UIcon name="i-lucide-moon-star" class="h-5 w-5 opacity-40" />
          {{ t('dashboard.topApps.empty') }}
        </div>
      </div>
    </section>

    <!-- Activity log -->
    <section class="panel">
      <header class="panel-header">
        <span class="micro-label">{{ t('dashboard.activityLog.title') }}</span>
        <span class="text-[11px] tabular-nums text-muted">{{ recentRecords.length }}</span>
      </header>
      <div v-if="recentRecords.length" class="divide-y divide-(--ui-border)">
        <div
          v-for="(record, index) in recentRecords"
          :key="record.id ?? `${record.timestamp}-${index}`"
          class="flex items-center gap-3 px-3 py-1.5 text-[11px] transition-colors hover:bg-(--ui-bg-elevated)"
        >
          <span class="h-1 w-1 shrink-0 rounded-full bg-emerald-500/70" />
          <span class="selectable min-w-0 flex-1 truncate text-xs font-medium">{{ record.program || t('common.unknown') }}</span>
          <span class="shrink-0 tabular-nums text-muted">{{ formatDuration(record.seconds) }}</span>
          <span class="shrink-0 tabular-nums text-muted opacity-60">{{ formatTimestamp(record.timestamp) }}</span>
          <UBadge
            v-if="record.event"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ record.event }}
          </UBadge>
        </div>
      </div>
      <div v-else class="flex flex-col items-center gap-2 px-3 py-6 text-xs text-muted">
        <UIcon name="i-lucide-sparkles" class="h-5 w-5 opacity-40" />
        {{ t('dashboard.activityLog.empty') }}
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatDuration, formatTimestamp } from '@/utils/format';
import { useElectron } from '@/composables/useElectron';
import { useCheckInterval } from '@/composables/useCheckInterval';
import { useI18n } from 'vue-i18n';

type ActivityRecord = {
  id?: string | number;
  program?: string;
  event?: string;
  timestamp?: string | number | Date;
  seconds?: number;
};

type ForegroundRecord = {
  program?: string;
  timestamp?: string | number | Date;
  seconds?: number;
};

type BackgroundRecord = {
  program?: string;
  timestamp?: string | number | Date;
  seconds?: number;
};

const electron = useElectron();
const { checkInterval } = useCheckInterval();
const { t } = useI18n();

type RangeKey = 'minute' | 'hour' | 'day';
type RangeItem = {
  key: RangeKey;
  label: string;
  caption: string;
  channel: string;
  duration: number;
};

const ranges = computed<RangeItem[]>(() => [
  {
    key: 'minute',
    label: t('ranges.lastHour'),
    caption: t('ranges.caption.lastHour'),
    channel: 'get-minutes-records',
    duration: 60 * 60 * 1000,
  },
  {
    key: 'hour',
    label: t('ranges.last3Days'),
    caption: t('ranges.caption.last3Days'),
    channel: 'get-hours-records',
    duration: 60 * 60 * 72 * 1000,
  },
  {
    key: 'day',
    label: t('ranges.last90Days'),
    caption: t('ranges.caption.last90Days'),
    channel: 'get-days-records',
    duration: 60 * 60 * 24 * 1000 * 90,
  },
]);

const activeRangeKey = ref<RangeKey>('minute');
const activeRange = computed(
  () => ranges.value.find((range) => range.key === activeRangeKey.value) ?? ranges.value[0]
);
const records = ref<ActivityRecord[]>([]);
const loading = ref(false);
const foregroundRecords = ref<ForegroundRecord[]>([]);
const loadingForeground = ref(false);
const backgroundRecords = ref<BackgroundRecord[]>([]);
const loadingBackground = ref(false);

const refresh = async () => {
  if (!electron) {
    return;
  }
  const range = activeRange.value;
  loading.value = true;
  try {
    const data = await electron.invoke(range.channel, range.duration);
    records.value = Array.isArray(data) ? data : [];
  } catch {
    records.value = [];
  } finally {
    loading.value = false;
  }
};

const foregroundChannels = {
  minute: 'get-foreground-minutes-records',
  hour: 'get-foreground-hours-records',
  day: 'get-foreground-days-records',
} as const;

const backgroundChannels = {
  minute: 'get-background-minutes-records',
  hour: 'get-background-hours-records',
  day: 'get-background-days-records',
} as const;

const refreshForeground = async () => {
  if (!electron) {
    foregroundRecords.value = [];
    return;
  }
  loadingForeground.value = true;
  try {
    const channel = foregroundChannels[activeRange.value.key];
    const data = await electron.invoke(channel, activeRange.value.duration);
    foregroundRecords.value = Array.isArray(data) ? data : [];
  } catch {
    foregroundRecords.value = [];
  } finally {
    loadingForeground.value = false;
  }
};

const refreshBackground = async () => {
  if (!electron) {
    backgroundRecords.value = [];
    return;
  }
  loadingBackground.value = true;
  try {
    const channel = backgroundChannels[activeRange.value.key];
    const data = await electron.invoke(channel, activeRange.value.duration);
    backgroundRecords.value = Array.isArray(data) ? data : [];
  } catch {
    backgroundRecords.value = [];
  } finally {
    loadingBackground.value = false;
  }
};

const setRange = (range: RangeItem) => {
  activeRangeKey.value = range.key;
};

watch(
  () => activeRangeKey.value,
  () => {
    refreshAll();
  }
);

watch(checkInterval, () => {
  refreshAll();
  startInterval();
});

const totalSeconds = computed(() =>
  records.value.reduce((sum, record) => sum + (record.seconds ?? 0), 0)
);

const totalForegroundSeconds = computed(() =>
  foregroundRecords.value.reduce((sum, record) => sum + (record.seconds ?? 0), 0)
);

const totalBackgroundSeconds = computed(() =>
  backgroundRecords.value.reduce((sum, record) => sum + (record.seconds ?? 0), 0)
);

const totalTrackedSeconds = computed(
  () => totalForegroundSeconds.value + totalBackgroundSeconds.value
);

const foregroundPercent = computed(() => {
  const total = totalTrackedSeconds.value;
  if (!total) {
    return 0;
  }
  return Math.round((totalForegroundSeconds.value / total) * 100);
});

const uniquePrograms = computed(() => {
  const programs = new Set<string>();
  records.value.forEach((record) => {
    if (record.program) {
      programs.add(record.program);
    }
  });
  foregroundRecords.value.forEach((record) => {
    if (record.program) {
      programs.add(record.program);
    }
  });
  backgroundRecords.value.forEach((record) => {
    if (record.program) {
      programs.add(record.program);
    }
  });
  return programs.size;
});

const topPrograms = computed(() => {
  const totals = new Map<string, number>();
  records.value.forEach((record) => {
    if (!record.program) {
      return;
    }
    totals.set(
      record.program,
      (totals.get(record.program) ?? 0) + (record.seconds ?? 0)
    );
  });
  const total = totalSeconds.value || 1;
  return Array.from(totals.entries())
    .map(([name, seconds]) => ({
      name,
      seconds,
      percent: Math.round((seconds / total) * 100),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 6);
});

const recentRecords = computed(() =>
  [...records.value]
    .sort((a, b) => {
      const aTime = new Date(a.timestamp ?? 0).getTime();
      const bTime = new Date(b.timestamp ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 6)
);

const isSyncing = computed(
  () => loading.value || loadingForeground.value || loadingBackground.value
);

let intervalId: ReturnType<typeof setInterval> | null = null;

const refreshAll = () => {
  refresh();
  refreshForeground();
  refreshBackground();
};

const startInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  const delay = Math.max(1, checkInterval.value) * 1000;
  intervalId = setInterval(refreshAll, delay);
};

const stopInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

onMounted(() => {
  refreshAll();
  startInterval();
});

onBeforeUnmount(() => {
  stopInterval();
});
</script>
