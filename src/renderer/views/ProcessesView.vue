<template>
  <div class="space-y-4">
    <section class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">App Breakdown</h1>
        <p class="text-sm text-muted">
          Foreground and background presence per app.
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

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          Total Time
        </div>
        <div class="text-2xl font-semibold mt-2">
          {{ formatDuration(totalTrackedSeconds) }}
        </div>
        <div class="text-xs text-muted mt-1">
          {{ activeRange.caption }}
        </div>
      </div>
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          Foreground Time
        </div>
        <div class="text-2xl font-semibold mt-2">
          {{ formatDuration(totalForegroundSeconds) }}
        </div>
        <div class="text-xs text-muted mt-1">
          Time in front of you.
        </div>
      </div>
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          Background Time
        </div>
        <div class="text-2xl font-semibold mt-2">
          {{ formatDuration(totalBackgroundSeconds) }}
        </div>
        <div class="text-xs text-muted mt-1">
          Running behind the scenes.
        </div>
      </div>
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          Tracked Apps
        </div>
        <div class="text-2xl font-semibold mt-2">
          {{ uniquePrograms }}
        </div>
        <div class="text-xs text-muted mt-1">
          Foreground or background records.
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">App Detail</h2>
          <p class="text-xs text-muted">
            Totals, split, and last seen per app.
          </p>
        </div>
        <UBadge color="neutral" variant="soft">{{ processRows.length }}</UBadge>
      </div>
      <div v-if="processRows.length" class="mt-4 space-y-2">
        <div
          class="grid grid-cols-[minmax(0,1fr)_84px_84px_84px_120px] items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-muted"
        >
          <span>Process</span>
          <span class="text-right">Total</span>
          <span class="text-right">Foreground</span>
          <span class="text-right">Background</span>
          <span class="text-right">Last Seen</span>
        </div>
        <div
          v-for="row in processRows"
          :key="row.name"
          class="space-y-2 rounded-lg bg-muted px-3 py-2 text-xs"
        >
          <div
            class="grid grid-cols-[minmax(0,1fr)_84px_84px_84px_120px] items-center gap-4"
          >
            <div class="flex min-w-0 items-center gap-2">
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/70"
              >
                <img
                  v-if="iconMap[row.name]"
                  :src="iconMap[row.name]"
                  alt=""
                  class="h-4 w-4"
                />
                <div
                  v-else
                  class="h-4 w-4 rounded bg-muted-foreground/30"
                ></div>
              </div>
              <div class="truncate font-medium">{{ row.name }}</div>
            </div>
            <div class="text-right text-muted tabular-nums">
              {{ formatDuration(row.total) }}
            </div>
            <div class="text-right text-muted tabular-nums">
              {{ formatDuration(row.foreground) }}
            </div>
            <div class="text-right text-muted tabular-nums">
              {{ formatDuration(row.background) }}
            </div>
            <div class="text-right text-muted tabular-nums">
              {{ row.lastSeen ? formatTimestamp(row.lastSeen) : '--' }}
            </div>
          </div>
          <UProgress
            class="w-full"
            :model-value="row.foregroundPercent"
            :max="100"
            color="neutral"
            size="2xs"
          />
        </div>
      </div>
      <div v-else class="mt-4 text-xs text-muted">
        {{
          loading ? 'Reading process stats...' : 'No process time recorded yet.'
        }}
      </div>
    </section>

    <section v-if="loading" class="text-sm text-muted">
      Syncing process stats...
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatDuration, formatTimestamp } from '@/utils/format';
import { useElectron } from '@/composables/useElectron';
import { useCheckInterval } from '@/composables/useCheckInterval';

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

const ranges = [
  {
    key: 'minute',
    label: 'Last Hour',
    caption: 'Rolling 60 minutes of activity',
    duration: 60 * 60 * 1000,
  },
  {
    key: 'hour',
    label: 'Last 3 Days',
    caption: 'Highlights for the past 72 hours',
    duration: 60 * 60 * 72 * 1000,
  },
  {
    key: 'day',
    label: 'Last 90 Days',
    caption: 'Daily rhythm across the last quarter',
    duration: 60 * 60 * 24 * 1000 * 90,
  },
];

const activeRange = ref(ranges[0]);
const foregroundRecords = ref<ForegroundRecord[]>([]);
const backgroundRecords = ref<BackgroundRecord[]>([]);
const loading = ref(false);
const iconMap = ref<Record<string, string | null>>({});
const iconLastAttempt = ref<Record<string, number>>({});
let iconLookupAvailable = true;
let iconRetryTimer: ReturnType<typeof setTimeout> | null = null;
const ICON_RETRY_MS = 5 * 60 * 1000;
const ICON_FAILURE_BACKOFF_MS = 30 * 1000;

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
  loading.value = true;
  const foregroundChannel = foregroundChannels[activeRange.value.key];
  const backgroundChannel = backgroundChannels[activeRange.value.key];
  const [foregroundResult, backgroundResult] = await Promise.allSettled([
    electron.invoke(foregroundChannel, activeRange.value.duration),
    electron.invoke(backgroundChannel, activeRange.value.duration),
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

const setRange = (range: (typeof ranges)[number]) => {
  activeRange.value = range;
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
  () => activeRange.value.key,
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

const totalBackgroundSeconds = computed(() =>
  backgroundRecords.value.reduce((sum, record) => sum + (record.seconds ?? 0), 0)
);

const totalTrackedSeconds = computed(
  () => totalForegroundSeconds.value + totalBackgroundSeconds.value
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
  return Array.from(totals.entries())
    .map(([name, values]) => {
      const total = values.foreground + values.background;
      const foregroundPercent =
        total > 0 ? Math.round((values.foreground / total) * 100) : 0;
      return {
        name,
        foreground: values.foreground,
        background: values.background,
        total,
        lastSeen: values.lastSeen,
        foregroundPercent,
      };
    })
    .sort((a, b) => b.total - a.total);
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
  startInterval();
});

onBeforeUnmount(() => {
  stopInterval();
  if (iconRetryTimer) {
    clearTimeout(iconRetryTimer);
  }
});
</script>
