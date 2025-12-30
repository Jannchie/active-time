import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useElectron } from '@/composables/useElectron';

const DEFAULT_INTERVAL = 5;
const MIN_INTERVAL = 1;
const MAX_INTERVAL = 60;

const normalizeInterval = (value: unknown) => {
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric)) {
    return DEFAULT_INTERVAL;
  }
  return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, numeric));
};

export const useCheckInterval = () => {
  const electron = useElectron();
  const checkInterval = ref(DEFAULT_INTERVAL);
  let stopListener: (() => void) | undefined;

  const refreshInterval = async () => {
    if (!electron) {
      return;
    }
    try {
      const value = await electron.invoke('get-check-interval');
      checkInterval.value = normalizeInterval(value);
    } catch {
      // Keep previous value on IPC failure.
    }
  };

  const setCheckInterval = async (value: number) => {
    const normalized = normalizeInterval(value);
    checkInterval.value = normalized;
    if (!electron) {
      return;
    }
    try {
      await electron.invoke('set-check-interval', normalized);
    } catch {
      // Revert to previous on failure by reloading.
      await refreshInterval();
    }
  };

  onMounted(() => {
    refreshInterval();
    if (!electron) {
      return;
    }
    stopListener = electron.on('check-interval-changed', (value) => {
      checkInterval.value = normalizeInterval(value);
    });
  });

  onBeforeUnmount(() => {
    stopListener?.();
  });

  return {
    checkInterval,
    refreshInterval,
    setCheckInterval,
  };
};
