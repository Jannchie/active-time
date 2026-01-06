<template>
  <div class="space-y-4">
    <section class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">{{ t('processes.title') }}</h1>
        <p class="text-sm text-muted">
          {{ t('processes.description') }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="range in ranges"
          :key="range.key"
          size="xs"
          :variant="activeRange.key === range.key ? 'solid' : 'ghost'"
          color="neutral"
          class="rounded-full"
          @click="setRange(range)"
        >
          {{ range.label }}
        </UButton>
      </div>
    </section>

    <section class="grid gap-3 md:grid-cols-2">
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          {{ t('processes.metrics.foregroundTime') }}
        </div>
        <div class="text-2xl font-semibold mt-2">
          {{ formatDuration(totalForegroundSeconds) }}
        </div>
        <div class="text-xs text-muted mt-1">
          {{ t('processes.metrics.foregroundHint') }}
        </div>
      </div>
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          {{ t('processes.metrics.trackedApps') }}
        </div>
        <div class="text-2xl font-semibold mt-2">
          {{ uniquePrograms }}
        </div>
        <div class="text-xs text-muted mt-1">
          {{ t('processes.metrics.trackedAppsHint') }}
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">{{ t('processes.detail.title') }}</h2>
          <p class="text-xs text-muted">
            {{ t('processes.detail.description') }}
          </p>
        </div>
        <UBadge color="neutral" variant="soft">{{ processRows.length }}</UBadge>
      </div>
      <div class="mt-2 text-xs text-muted">
        {{ t('processes.sortedBy', { sort: sortLabel }) }}
      </div>
      <div v-if="processRows.length" class="mt-4 space-y-2">
        <div
          class="grid grid-cols-[minmax(0,1fr)_84px_120px] items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-muted"
        >
          <span>{{ t('processes.table.process') }}</span>
          <span class="text-right">{{ t('processes.table.foreground') }}</span>
          <span class="text-right">{{ t('processes.table.lastSeen') }}</span>
        </div>
        <div
          v-for="row in processRows"
          :key="row.name"
          class="space-y-2 rounded-lg bg-muted px-3 py-2 text-xs"
        >
          <div
            class="grid grid-cols-[minmax(0,1fr)_84px_120px] items-center gap-4"
          >
            <div class="flex min-w-0 items-center gap-2">
              <button
                type="button"
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-transparent text-muted transition hover:border-muted/60 hover:text-foreground"
                :class="isMarked(row.name) ? 'text-amber-400' : ''"
                :title="isMarked(row.name) ? t('processes.unmark') : t('processes.mark')"
                :aria-label="isMarked(row.name) ? t('processes.unmark') : t('processes.mark')"
                :aria-pressed="isMarked(row.name)"
                @click="toggleMarked(row.name)"
              >
                <UIcon name="i-lucide-star" class="h-3.5 w-3.5" />
              </button>
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/70"
              >
                <img
                  v-if="iconMap[row.name]"
                  :src="iconMap[row.name]"
                  alt=""
                  class="h-4 w-4"
                >
                <div
                  v-else
                  class="h-4 w-4 rounded bg-muted-foreground/30"
                />
              </div>
              <div class="truncate font-medium">{{ row.name }}</div>
            </div>
            <div class="text-right text-muted tabular-nums">
              {{ formatDuration(row.foreground) }}
            </div>
            <div class="text-right text-muted tabular-nums">
              {{ row.lastSeen ? formatTimestamp(row.lastSeen) : '--' }}
            </div>
          </div>
          <UProgress
            class="w-full"
            :model-value="row.progressValue"
            :max="100"
            color="neutral"
            size="2xs"
          />
        </div>
      </div>
      <div v-else class="mt-4 text-xs text-muted">
        {{ loading ? t('processes.loading') : t('processes.empty') }}
      </div>
    </section>

    <section v-if="loading" class="text-sm text-muted">
      {{ t('processes.syncing') }}
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatDuration, formatTimestamp } from '@/utils/format';
import { useElectron } from '@/composables/useElectron';
import { useCheckInterval } from '@/composables/useCheckInterval';
import { useI18n } from 'vue-i18n';

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
  duration: number;
};

const ranges = computed<RangeItem[]>(() => [
  {
    key: 'minute',
    label: t('ranges.lastHour'),
    caption: t('ranges.caption.lastHour'),
    duration: 60 * 60 * 1000,
  },
  {
    key: 'hour',
    label: t('ranges.last3Days'),
    caption: t('ranges.caption.last3Days'),
    duration: 60 * 60 * 72 * 1000,
  },
  {
    key: 'day',
    label: t('ranges.last90Days'),
    caption: t('ranges.caption.last90Days'),
    duration: 60 * 60 * 24 * 1000 * 90,
  },
]);

const activeRangeKey = ref<RangeKey>('minute');
const activeRange = computed(
  () => ranges.value.find((range) => range.key === activeRangeKey.value) ?? ranges.value[0]
);
const foregroundRecords = ref<ForegroundRecord[]>([]);
const backgroundRecords = ref<BackgroundRecord[]>([]);
const loading = ref(false);
const sortLabel = computed(() => t('processes.sort.foreground'));
const iconMap = ref<Record<string, string | null>>({});
const iconLastAttempt = ref<Record<string, number>>({});
const markedPrograms = ref<Set<string>>(new Set());
let iconLookupAvailable = true;
let iconRetryTimer: ReturnType<typeof setTimeout> | null = null;
const ICON_RETRY_MS = 5 * 60 * 1000;
const ICON_FAILURE_BACKOFF_MS = 30 * 1000;

const normalizeName = (value: string) => value.trim().toLowerCase();

const refreshMarkedPrograms = async () => {
  if (!electron) {
    markedPrograms.value = new Set();
    return;
  }
  try {
    const data = await electron.invoke('get-marked-programs');
    const next = new Set<string>();
    if (Array.isArray(data)) {
      data.forEach((name) => {
        if (typeof name !== 'string') {
          return;
        }
        const key = normalizeName(name);
        if (key) {
          next.add(key);
        }
      });
    }
    markedPrograms.value = next;
  } catch {
    markedPrograms.value = new Set();
  }
};

const isMarked = (name: string) => markedPrograms.value.has(normalizeName(name));

const toggleMarked = async (name: string) => {
  if (!electron) {
    return;
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  const key = normalizeName(trimmed);
  const next = new Set(markedPrograms.value);
  const alreadyMarked = next.has(key);
  if (alreadyMarked) {
    next.delete(key);
  } else {
    next.add(key);
  }
  markedPrograms.value = next;
  try {
    await electron.invoke(
      alreadyMarked ? 'remove-marked-program' : 'add-marked-program',
      trimmed
    );
  } catch {
    refreshMarkedPrograms();
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

const refresh = async () => {
  if (!electron) {
    foregroundRecords.value = [];
    backgroundRecords.value = [];
    iconMap.value = {};
    iconLastAttempt.value = {};
    return;
  }
  const range = activeRange.value;
  loading.value = true;
  const foregroundChannel = foregroundChannels[activeRange.value.key];
  const backgroundChannel = backgroundChannels[activeRange.value.key];
  const [foregroundResult, backgroundResult] = await Promise.allSettled([
    electron.invoke(foregroundChannel, range.duration),
    electron.invoke(backgroundChannel, range.duration),
  ]);
  foregroundRecords.value =
    foregroundResult.status === 'fulfilled' &&
    Array.isArray(foregroundResult.value)
      ? foregroundResult.value
      : [];
  backgroundRecords.value =
    backgroundResult.status === 'fulfilled' &&
    Array.isArray(backgroundResult.value)
      ? backgroundResult.value
      : [];
  loading.value = false;
  void refreshIcons(processRows.value.map((row) => row.name));
};

const setRange = (range: RangeItem) => {
  activeRangeKey.value = range.key;
};

const refreshIcons = async (names: string[]) => {
  if (!electron) {
    iconMap.value = {};
    return;
  }
  if (!iconLookupAvailable) {
    return;
  }
  const now = Date.now();
  const uniqueNames = [
    ...new Set(names.map((name) => name.trim()).filter(Boolean)),
  ];
  const missing = uniqueNames.filter(
    (name) =>
      iconMap.value[name] === undefined ||
      (iconMap.value[name] === null &&
        now - (iconLastAttempt.value[name] ?? 0) > ICON_RETRY_MS)
  );
  if (!missing.length) {
    return;
  }
  let result: unknown;
  try {
    result = await electron.invoke('get-program-icons', missing);
  } catch {
    iconLookupAvailable = false;
    if (iconRetryTimer) {
      clearTimeout(iconRetryTimer);
    }
    iconRetryTimer = setTimeout(() => {
      iconLookupAvailable = true;
    }, ICON_FAILURE_BACKOFF_MS);
    const next = { ...iconMap.value };
    const nextAttempts = { ...iconLastAttempt.value };
    missing.forEach((name) => {
      if (next[name] === undefined) {
        next[name] = null;
      }
      nextAttempts[name] = now;
    });
    iconMap.value = next;
    iconLastAttempt.value = nextAttempts;
    return;
  }
  if (!result || typeof result !== 'object') {
    const nextAttempts = { ...iconLastAttempt.value };
    missing.forEach((name) => {
      nextAttempts[name] = now;
    });
    iconLastAttempt.value = nextAttempts;
    return;
  }
  const next = { ...iconMap.value };
  const nextAttempts = { ...iconLastAttempt.value };
  const map = result as Record<string, string | null>;
  missing.forEach((name) => {
    next[name] = map[name] ?? null;
    nextAttempts[name] = now;
  });
  iconMap.value = next;
  iconLastAttempt.value = nextAttempts;
};

watch(
  () => activeRangeKey.value,
  () => {
    refresh();
  }
);

watch(checkInterval, () => {
  refresh();
  startInterval();
});

const totalForegroundSeconds = computed(() =>
  foregroundRecords.value.reduce((sum, record) => sum + (record.seconds ?? 0), 0)
);

const uniquePrograms = computed(() => {
  const programs = new Set<string>();
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

const processRows = computed(() => {
  const totals = new Map<
    string,
    { foreground: number; background: number; lastSeen: number | null }
  >();
  const toTimestamp = (value?: string | number | Date) => {
    if (value === undefined || value === null) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    return Number.isNaN(time) ? null : time;
  };
  const applyRecord = (
    record: ForegroundRecord | BackgroundRecord,
    key: 'foreground' | 'background'
  ) => {
    if (!record.program) {
      return;
    }
    const current = totals.get(record.program) ?? {
      foreground: 0,
      background: 0,
      lastSeen: null,
    };
    current[key] += record.seconds ?? 0;
    const time = toTimestamp(record.timestamp);
    if (time !== null) {
      current.lastSeen = Math.max(current.lastSeen ?? 0, time);
    }
    totals.set(record.program, current);
  };
  foregroundRecords.value.forEach((record) => {
    applyRecord(record, 'foreground');
  });
  backgroundRecords.value.forEach((record) => {
    applyRecord(record, 'background');
  });
  const resolveSortValue = (row: { foreground: number }) => row.foreground;
  const rows = Array.from(totals.entries())
    .map(([name, values]) => {
      const sortValue = resolveSortValue({
        foreground: values.foreground,
      });
      return {
        name,
        foreground: values.foreground,
        background: values.background,
        lastSeen: values.lastSeen,
        sortValue,
      };
    });
  let maxSortValue = 0;
  rows.forEach((row) => {
    maxSortValue = Math.max(maxSortValue, row.sortValue);
  });
  return rows
    .sort((a, b) => {
      if (a.sortValue === b.sortValue) {
        return a.name.localeCompare(b.name);
      }
      return b.sortValue - a.sortValue;
    })
    .map((row) => ({
      ...row,
      progressValue:
        maxSortValue > 0 ? Math.round((row.sortValue / maxSortValue) * 100) : 0,
    }));
});

let intervalId: ReturnType<typeof setInterval> | null = null;

const startInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  const delay = Math.max(1, checkInterval.value) * 1000;
  intervalId = setInterval(refresh, delay);
};

const stopInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

onMounted(() => {
  refresh();
  refreshMarkedPrograms();
  startInterval();
});

onBeforeUnmount(() => {
  stopInterval();
  if (iconRetryTimer) {
    clearTimeout(iconRetryTimer);
  }
});
</script>
