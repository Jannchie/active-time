<template>
  <UApp>
    <UDashboardGroup unit="rem" storage="local" storage-key="dashboard-v2" :persistent="true">
      <UDashboardSidebar
        id="sidebar"
        class="app-sidebar"
        side="left"
        :collapsible="true"
        :resizable="false"
        :min-size="14"
        :max-size="20"
        :default-size="16"
        :collapsed-size="5"
        :ui="{ header: 'px-3', body: 'px-3 py-2 gap-3', footer: 'px-3 py-2' }"
      >
        <template #header="{ collapsed }">
          <div class="flex w-full items-center gap-2 py-1.5">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center text-emerald-500">
              <UIcon name="i-lucide-timer" class="h-4 w-4" />
            </div>
            <div v-if="!collapsed" class="micro-label tracking-[0.3em]">
              {{ t('app.name') }}
            </div>
          </div>
        </template>
        <template #default="{ collapsed }">
          <SidebarNav v-model="activeView" :collapsed="collapsed" />
        </template>
        <template #footer="{ collapsed }">
          <SidebarStatus :collapsed="collapsed" />
        </template>
      </UDashboardSidebar>

      <UDashboardPanel
        id="main"
        :resizable="false"
        :ui="{ body: 'gap-0 sm:gap-0 p-3 sm:p-4' }"
      >
        <template #header>
          <TitleBar />
        </template>
        <template #body>
          <Transition name="view" mode="out-in">
            <component :is="currentView" v-bind="viewProps" />
          </Transition>
        </template>
        <template #footer>
          <StatusBar />
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TitleBar from '@/components/TitleBar.vue';
import SidebarNav from '@/components/SidebarNav.vue';
import StatusBar from '@/components/StatusBar.vue';
import SidebarStatus from '@/components/SidebarStatus.vue';
import DashboardView from '@/views/DashboardView.vue';
import ProcessesView from '@/views/ProcessesView.vue';
import SettingsView from '@/views/SettingsView.vue';
import AboutView from '@/views/AboutView.vue';
import { useElectron } from '@/composables/useElectron';

type ThemeMode = 'dark' | 'light' | 'system';

const activeView = ref('dashboard');
const theme = ref<ThemeMode>('system');
let mediaQuery: MediaQueryList | null = null;
const electron = useElectron();
const { t } = useI18n();

const handleMediaChange = () => {
  if (theme.value === 'system') {
    applyTheme();
  }
};

const applyTheme = () => {
  if (typeof window === 'undefined') {
    return;
  }
  const prefersDark =
    theme.value === 'system' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme.value === 'dark' || prefersDark;
  document.documentElement.classList.toggle('dark', isDark);
  if (electron) {
    electron.invoke('set-titlebar-theme', isDark);
  }
};

const setTheme = (value: ThemeMode) => {
  theme.value = value;
};

const currentView = computed(() => {
  switch (activeView.value) {
    case 'processes':
      return ProcessesView;
    case 'settings':
      return SettingsView;
    case 'about':
      return AboutView;
    default:
      return DashboardView;
  }
});

const viewProps = computed(() => {
  if (activeView.value !== 'settings') {
    return {};
  }
  return {
    theme: theme.value,
    'onUpdate:theme': setTheme,
  };
});

watch(theme, () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', theme.value);
  }
  applyTheme();
});

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const stored = localStorage.getItem('theme') as ThemeMode | null;
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    theme.value = stored;
  }
  applyTheme();

  const storedInterval = localStorage.getItem('checkInterval');
  if (storedInterval !== null && electron) {
    const numeric = Number(storedInterval);
    if (Number.isFinite(numeric)) {
      electron.invoke('set-check-interval', numeric);
    }
  }

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', handleMediaChange);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', handleMediaChange);
});
</script>
