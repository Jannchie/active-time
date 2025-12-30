<template>
  <div class="space-y-4">
    <section class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Activity Pulse</h1>
        <p class="text-sm text-muted">
          Snapshot your focus sessions without the charts.
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

    <section class="grid gap-3 lg:grid-cols-3">
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          Total Focus
        </div>
        <div class="text-2xl font-semibold mt-2">
          {{ formatDuration(totalSeconds) }}
        </div>
        <div class="text-xs text-muted mt-1">
          {{ activeRange.caption }}
        </div>
      </div>
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          Unique Apps
        </div>
        <div class="text-2xl font-semibold mt-2">
          {{ uniquePrograms }}
        </div>
        <div class="text-xs text-muted mt-1">
          Across {{ uniqueTitles }} window titles.
        </div>
      </div>
      <div class="panel">
        <div class="text-xs uppercase tracking-[0.2em] text-muted">
          Dominant Task
        </div>
        <div class="text-lg font-semibold mt-2">
          {{ topProgram?.name || '--' }}
        </div>
        <div class="text-xs text-muted mt-1">
          {{ topProgram ? formatDuration(topProgram.seconds) : 'No records yet.' }}
        </div>
      </div>
    </section>

    <section class="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <div class="panel">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">Top Applications</h2>
            <p class="text-xs text-muted">
              Ranked by total active time.
            </p>
          </div>
          <UBadge color="neutral" variant="soft">Top 6</UBadge>
        </div>
        <div v-if="topPrograms.length" class="mt-4 space-y-3">
          <div v-for="item in topPrograms" :key="item.name" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{{ item.name }}</span>
              <span class="text-muted">
                {{ formatDuration(item.seconds) }}
              </span>
            </div>
            <UProgress
              :model-value="item.percent"
              :max="100"
              color="neutral"
              size="2xs"
            />
          </div>
        </div>
        <div
          v-else
          class="mt-5 flex flex-col items-center gap-2 text-sm text-muted"
        >
          <UIcon name="i-lucide-moon-star" class="h-6 w-6" />
          Collecting fresh activity records...
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Foreground Time</h3>
            <span class="text-xs text-muted">Top 6</span>
          </div>
          <div v-if="topForegroundPrograms.length" class="space-y-2">
            <div
              v-for="item in topForegroundPrograms"
              :key="item.name"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-muted">
                  {{ formatDuration(item.seconds) }}
                </span>
              </div>
              <UProgress
                :model-value="item.percent"
                :max="100"
                color="neutral"
                size="2xs"
              />
            </div>
          </div>
          <div v-else class="text-xs text-muted">
            {{
              loadingForeground
                ? 'Reading foreground time...'
                : 'No foreground data.'
            }}
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Background Time</h3>
            <span class="text-xs text-muted">Top 6</span>
          </div>
          <div v-if="topBackgroundPrograms.length" class="space-y-2">
            <div
              v-for="item in topBackgroundPrograms"
              :key="item.name"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-muted">
                  {{ formatDuration(item.seconds) }}
                </span>
              </div>
              <UProgress
                :model-value="item.percent"
                :max="100"
                color="neutral"
                size="2xs"
              />
            </div>
          </div>
          <div v-else class="text-xs text-muted">
            {{
              loadingBackground
                ? 'Reading background time...'
                : 'No background data.'
            }}
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Latest Entries</h2>
          <UBadge color="neutral" variant="soft">{{ recentRecords.length }}</UBadge>
        </div>
        <div class="mt-3 space-y-2">
          <div
            v-for="(record, index) in recentRecords"
            :key="record.id ?? `${record.timestamp}-${index}`"
            class="rounded-lg bg-muted px-3 py-2 text-xs"
          >
            <div class="flex items-center justify-between">
              <span class="font-semibold">{{ record.program || 'Unknown' }}</span>
              <span class="text-muted">
                {{ formatDuration(record.seconds) }}
              </span>
            </div>
            <div class="text-muted mt-1 break-words">
              {{ record.title || 'Untitled window' }}
            </div>
            <div class="text-muted mt-1">
              {{ formatTimestamp(record.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="loading" class="text-sm text-muted">
      Syncing latest records...
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatDuration, formatTimestamp } from '@/utils/format';
import { useElectron } from '@/composables/useElectron';
import { useCheckInterval } from '@/composables/useCheckInterval';

type ActivityRecord = {
  id?: string | number;
  program?: string;
  title?: string;
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

const ranges = [
  {
    key: 'minute',
    label: 'Last Hour',
    caption: 'Rolling 60 minutes of activity',
    channel: 'get-minutes-records',
    duration: 60 * 60 * 1000,
  },
  {
    key: 'hour',
    label: 'Last 3 Days',
    caption: 'Highlights for the past 72 hours',
    channel: 'get-hours-records',
    duration: 60 * 60 * 72 * 1000,
  },
  {
    key: 'day',
    label: 'Last 90 Days',
    caption: 'Daily rhythm across the last quarter',
    channel: 'get-days-records',
    duration: 60 * 60 * 24 * 1000 * 90,
  },
];

const activeRange = ref(ranges[0]);
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
  loading.value = true;
  try {
    const data = await electron.invoke(
      activeRange.value.channel,
      activeRange.value.duration
    );
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

const setRange = (range: (typeof ranges)[number]) => {
  activeRange.value = range;
};

watch(
  () => activeRange.value.key,
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

const uniquePrograms = computed(
  () =>
    new Set(
      records.value.map((record) => record.program).filter(Boolean)
    ).size
);

const uniqueTitles = computed(
  () =>
    new Set(records.value.map((record) => record.title).filter(Boolean)).size
);

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

const topForegroundPrograms = computed(() => {
  const totals = new Map<string, number>();
  foregroundRecords.value.forEach((record) => {
    if (!record.program) {
      return;
    }
    totals.set(
      record.program,
      (totals.get(record.program) ?? 0) + (record.seconds ?? 0)
    );
  });
  const rangeSeconds = Math.max(
    1,
    Math.floor(activeRange.value.duration / 1000)
  );
  return Array.from(totals.entries())
    .map(([name, seconds]) => ({
      name,
      seconds,
      percent: Math.min(100, Math.round((seconds / rangeSeconds) * 100)),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 6);
});

const topBackgroundPrograms = computed(() => {
  const totals = new Map<string, number>();
  backgroundRecords.value.forEach((record) => {
    if (!record.program) {
      return;
    }
    totals.set(
      record.program,
      (totals.get(record.program) ?? 0) + (record.seconds ?? 0)
    );
  });
  const rangeSeconds = Math.max(
    1,
    Math.floor(activeRange.value.duration / 1000)
  );
  return Array.from(totals.entries())
    .map(([name, seconds]) => ({
      name,
      seconds,
      percent: Math.min(100, Math.round((seconds / rangeSeconds) * 100)),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 6);
});

const topProgram = computed(() => topPrograms.value[0]);

const recentRecords = computed(() =>
  [...records.value]
    .sort((a, b) => {
      const aTime = new Date(a.timestamp ?? 0).getTime();
      const bTime = new Date(b.timestamp ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 6)
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
