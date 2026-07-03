<template>
  <div class="flex flex-col gap-3">
    <!-- Toolbar -->
    <section class="flex items-center justify-between gap-2">
      <h1 class="text-sm font-bold tracking-wide">{{ t('about.title') }}</h1>
    </section>

    <!-- Identity card -->
    <section class="panel p-4">
      <div class="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-(--ui-border) bg-(--ui-bg-muted) text-emerald-500">
          <svg class="h-6 w-6" viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M87.6445 104.513H59.248L65.2676 87.3047H80.9707L57.7432 27.1748H85.9434L120.556 114H91.3086L87.6445 104.513ZM51.5273 114H23.5889L54.6025 31.1006L67.4268 65.582L51.5273 114Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div class="min-w-0 space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold">{{ t('app.name') }}</span>
            <UBadge color="neutral" variant="subtle" size="xs">
              {{ t('common.version', { version: packageInfo.version }) }}
            </UBadge>
          </div>
          <div class="text-xs text-muted">{{ t('about.madeBy') }}</div>
        </div>
        <div class="flex-1" />
        <UButton
          to="https://github.com/Jannchie/active-time"
          target="_blank"
          color="neutral"
          variant="outline"
          size="xs"
        >
          <UIcon name="i-lucide-github" class="h-3.5 w-3.5" />
          {{ t('about.github') }}
        </UButton>
      </div>
    </section>

    <!-- What it tracks -->
    <section class="panel">
      <header class="panel-header">
        <span class="micro-label">{{ t('about.tracks.title') }}</span>
      </header>
      <div class="grid divide-y divide-(--ui-border) md:grid-cols-3 md:divide-x md:divide-y-0">
        <div class="p-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-app-window" class="h-3.5 w-3.5 text-emerald-500" />
            <span class="text-xs font-semibold">{{ t('about.tracks.apps.title') }}</span>
          </div>
          <p class="mt-1.5 text-xs leading-relaxed text-muted">{{ t('about.tracks.apps.description') }}</p>
        </div>
        <div class="p-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-eye" class="h-3.5 w-3.5 text-emerald-500" />
            <span class="text-xs font-semibold">{{ t('about.tracks.presence.title') }}</span>
          </div>
          <p class="mt-1.5 text-xs leading-relaxed text-muted">{{ t('about.tracks.presence.description') }}</p>
        </div>
        <div class="p-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-mouse-pointer-click" class="h-3.5 w-3.5 text-emerald-500" />
            <span class="text-xs font-semibold">{{ t('about.tracks.activity.title') }}</span>
          </div>
          <p class="mt-1.5 text-xs leading-relaxed text-muted">{{ t('about.tracks.activity.description') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import packageInfo from '../../../release/app/package.json';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
