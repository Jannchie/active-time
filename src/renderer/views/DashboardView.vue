<template>
  <div class="space-y-6 py-5">
    <!-- Header -->
    <section class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">{{ t('dashboard.title') }}</h1>
        <p class="mt-0.5 text-sm text-muted">{{ t('dashboard.description') }}</p>
      </div>
      <div class="flex gap-1">
        <UButton
          v-for="range in ranges"
          :key="range.key"
          size="xs"
          :variant="activeRange.key === range.key ? 'solid' : 'ghost'"
          color="neutral"
          @click="setRange(range)"
        >
          {{ range.label }}
        </UButton>
      </div>
    </section>

    <!-- Metric cards -->
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div class="rounded-xl border border-(--ui-border) p-4">
        <div class="text-xs text-muted">{{ t('dashboard.metrics.activeInput') }}</div>
        <div class="mt-1.5 text-2xl font-semibold tabular-nums">
          {{ formatDuration(totalSeconds) }}
        </div>
        <div class="mt-1.5 text-xs text-muted">{{ activeRange.caption }}</div>
      </div>
      <div class="rounded-xl border border-(--ui-border) p-4">
        <div class="text-xs text-muted">{{ t('dashboard.metrics.foregroundTime') }}</div>
        <div class="mt-1.5 text-2xl font-semibold tabular-nums text-emerald-500">
          {{ formatDuration(totalForegroundSeconds) }}
        </div>
        <div class="mt-1.5 text-xs text-muted">{{ t('dashboard.metrics.foregroundHint') }}</div>
      </div>
      <div class="rounded-xl border border-(--ui-border) p-4">
        <div class="text-xs text-muted">{{ t('dashboard.metrics.appsSeen') }}</div>
        <div class="mt-1.5 text-2xl font-semibold tabular-nums">
          {{ uniquePrograms }}
        </div>
        <div class="mt-1.5 text-xs text-muted">{{ t('dashboard.metrics.appsSeenHint') }}</div>
      </div>
    </section>

    <!-- Focus split + Top apps -->
    <section class="grid gap-4 lg:grid-cols-[1fr_2fr]">
      <!-- Focus presence -->
      <div class="rounded-xl border border-(--ui-border) p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold">{{ t('dashboard.focusSplit.title') }}</h2>
          <span class="text-xs text-muted tabular-nums">{{ formatDuration(totalTrackedSeconds) }}</span>
        </div>
        <p class="mt-0.5 text-xs text-muted">{{ t('dashboard.focusSplit.description') }}</p>
        <div class="mt-4 space-y-2.5">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium">{{ t('common.foreground') }}</span>
            <span class="text-muted tabular-nums">{{ formatDuration(totalForegroundSeconds) }}</span>
          </div>
          <UProgress
            :model-value="foregroundPercent"
            :max="100"
            color="success"
            size="xs"
          />
          <div class="text-xs text-muted">
            {{ t('dashboard.focusSplit.activeInputLogged', { duration: formatDuration(totalSeconds) }) }}
          </div>
        </div>
      </div>

      <!-- Top apps -->
      <div class="rounded-xl border border-(--ui-border) p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold">{{ t('dashboard.topApps.title') }}</h2>
          <span class="text-xs text-muted tabular-nums">{{ t('common.top', { count: topPrograms.length }) }}</span>
        </div>
        <p class="mt-0.5 text-xs text-muted">{{ t('dashboard.topApps.description') }}</p>
        <div v-if="topPrograms.length" class="mt-4 space-y-3">
          <div v-for="item in topPrograms" :key="item.name" class="space-y-1.5">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{{ item.name }}</span>
              <span class="text-muted tabular-nums">{{ formatDuration(item.seconds) }}</span>
            </div>
            <UProgress
              :model-value="item.percent"
              :max="100"
              color="neutral"
              size="xs"
            />
          </div>
        </div>
        <div v-else class="mt-6 flex flex-col items-center gap-2 py-4 text-sm text-muted">
          <UIcon name="i-lucide-moon-star" class="h-6 w-6 opacity-40" />
          {{ t('dashboard.topApps.empty') }}
        </div>
      </div>
    </section>

    <!-- Activity log -->
    <section class="rounded-xl border border-(--ui-border)">
      <div class="flex items-center justify-between p-4 pb-0">
        <div>
          <h2 class="text-sm font-semibold">{{ t('dashboard.activityLog.title') }}</h2>
          <p class="mt-0.5 text-xs text-muted">{{ t('dashboard.activityLog.description') }}</p>
        </div>
        <UBadge color="neutral" variant="subtle" size="xs">{{ recentRecords.length }}</UBadge>
      </div>
      <div v-if="recentRecords.length" class="mt-3 divide-y divide-(--ui-border)">
        <div
          v-for="(record, index) in recentRecords"
          :key="record.id ?? `${record.timestamp}-${index}`"
          class="flex items-center gap-4 px-4 py-2.5 text-xs transition-colors hover:bg-(--ui-bg-elevated)"
        >
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
          <span class="min-w-0 flex-1 truncate font-medium">{{ record.program || t('common.unknown') }}</span>
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
      <div v-else class="flex flex-col items-center gap-2 px-4 py-8 text-sm text-muted">
        <UIcon name="i-lucide-sparkles" class="h-6 w-6 opacity-40" />
        {{ t('dashboard.activityLog.empty') }}
      </div>
    </section>

    <!-- Syncing -->
    <div v-if="isSyncing" class="flex items-center gap-2 text-xs text-muted">
      <UIcon name="i-lucide-loader" class="h-3.5 w-3.5 animate-spin" />
      {{ t('dashboard.syncing') }}
    </div>
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
