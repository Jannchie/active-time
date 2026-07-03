<template>
  <div class="space-y-6 py-5">
    <!-- Header -->
    <section>
      <h1 class="text-lg font-semibold">{{ t('about.title') }}</h1>
      <p class="mt-0.5 text-sm text-muted">{{ t('about.description') }}</p>
    </section>

    <!-- Identity card -->
    <section class="rounded-xl border border-(--ui-border) p-5">
      <div class="flex flex-col items-start gap-5 md:flex-row md:items-center">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-(--ui-border) text-emerald-500">
          <LogoMark class="h-8 w-8" />
        </div>
        <div class="min-w-0 space-y-1">
          <UBadge color="neutral" variant="subtle" size="xs">
            {{ t('common.version', { version: packageInfo.version }) }}
          </UBadge>
          <div class="text-xl font-semibold">{{ t('app.name') }}</div>
          <div class="text-sm text-muted">{{ t('about.madeBy') }}</div>
        </div>
        <div class="flex-1" />
        <UButton
          to="https://github.com/Jannchie/active-time"
          target="_blank"
          color="neutral"
          variant="outline"
          size="sm"
        >
          <UIcon name="i-lucide-github" class="h-4 w-4" />
          {{ t('about.github') }}
        </UButton>
      </div>
    </section>

    <!-- What it tracks -->
    <section>
      <h2 class="text-sm font-semibold">{{ t('about.tracks.title') }}</h2>
      <div class="mt-3 grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-(--ui-border) p-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-app-window" class="h-4 w-4 text-emerald-500" />
            <span class="text-sm font-semibold">{{ t('about.tracks.apps.title') }}</span>
          </div>
          <p class="mt-2 text-xs text-muted leading-relaxed">{{ t('about.tracks.apps.description') }}</p>
        </div>
        <div class="rounded-xl border border-(--ui-border) p-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-eye" class="h-4 w-4 text-emerald-500" />
            <span class="text-sm font-semibold">{{ t('about.tracks.presence.title') }}</span>
          </div>
          <p class="mt-2 text-xs text-muted leading-relaxed">{{ t('about.tracks.presence.description') }}</p>
        </div>
        <div class="rounded-xl border border-(--ui-border) p-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-mouse-pointer-click" class="h-4 w-4 text-emerald-500" />
            <span class="text-sm font-semibold">{{ t('about.tracks.activity.title') }}</span>
          </div>
          <p class="mt-2 text-xs text-muted leading-relaxed">{{ t('about.tracks.activity.description') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import packageInfo from '../../../release/app/package.json';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const LogoMark = {
  template: `<svg viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M87.6445 104.513H59.248L65.2676 87.3047H80.9707L57.7432 27.1748H85.9434L120.556 114H91.3086L87.6445 104.513ZM51.5273 114H23.5889L54.6025 31.1006L67.4268 65.582L51.5273 114Z" fill="currentColor"/>
  </svg>`,
};
</script>
