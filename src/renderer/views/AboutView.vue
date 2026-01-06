<template>
  <div class="space-y-4">
    <section>
      <h1 class="text-xl font-semibold">{{ t('about.title') }}</h1>
      <p class="text-sm text-muted">
        {{ t('about.description') }}
      </p>
    </section>

    <section class="panel">
      <div class="flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted"
        >
          <LogoMark class="h-10 w-10" />
        </div>
        <div class="space-y-1">
          <div class="text-xs uppercase tracking-[0.3em] text-muted">
            {{ t('common.version', { version: packageInfo.version }) }}
          </div>
          <div class="text-xl font-semibold">{{ t('app.name') }}</div>
          <div class="text-sm text-muted">
            {{ t('about.madeBy') }}
          </div>
        </div>
        <div class="flex-1" />
        <UButton
          to="https://github.com/Jannchie/active-time"
          target="_blank"
          color="neutral"
          variant="outline"
        >
          <UIcon name="i-lucide-github" class="h-4 w-4" />
          {{ t('about.github') }}
        </UButton>
      </div>
    </section>

    <section class="panel">
      <h2 class="text-lg font-semibold">{{ t('about.tracks.title') }}</h2>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <div class="rounded-lg bg-muted px-3 py-2">
          <div class="text-sm font-semibold">{{ t('about.tracks.apps.title') }}</div>
          <div class="text-xs text-muted">
            {{ t('about.tracks.apps.description') }}
          </div>
        </div>
        <div class="rounded-lg bg-muted px-3 py-2">
          <div class="text-sm font-semibold">{{ t('about.tracks.presence.title') }}</div>
          <div class="text-xs text-muted">
            {{ t('about.tracks.presence.description') }}
          </div>
        </div>
        <div class="rounded-lg bg-muted px-3 py-2">
          <div class="text-sm font-semibold">{{ t('about.tracks.activity.title') }}</div>
          <div class="text-xs text-muted">
            {{ t('about.tracks.activity.description') }}
          </div>
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
