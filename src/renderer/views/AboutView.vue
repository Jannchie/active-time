<template>
  <div class="space-y-4">
    <section>
      <h1 class="text-xl font-semibold">About Active Time</h1>
      <p class="text-sm text-[var(--app-muted)]">
        A local-first focus tracker built for calm productivity.
      </p>
    </section>

    <section class="panel">
      <div class="flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl border text-[var(--app-text)]"
          :style="{
            background: 'var(--app-surface-soft)',
            borderColor: 'var(--app-border)',
          }"
        >
          <LogoMark class="h-10 w-10" />
        </div>
        <div class="space-y-1">
          <div class="text-xs uppercase tracking-[0.3em] text-[var(--app-muted)]">
            Version {{ packageInfo.version }}
          </div>
          <div class="text-xl font-semibold">Active Time</div>
          <div class="text-sm text-[var(--app-muted)]">
            Made by Jianqi Pan. Crafted for focused work habits.
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
          GitHub
        </UButton>
      </div>
    </section>

    <section class="panel">
      <h2 class="text-lg font-semibold">What it tracks</h2>
      <div class="mt-3 grid gap-3 md:grid-cols-3">
        <div
          class="rounded-lg px-3 py-2"
          :style="{ background: 'var(--app-surface-soft)' }"
        >
          <div class="text-sm font-semibold">Apps</div>
          <div class="text-xs text-[var(--app-muted)]">
            Time spent across active applications.
          </div>
        </div>
        <div
          class="rounded-lg px-3 py-2"
          :style="{ background: 'var(--app-surface-soft)' }"
        >
          <div class="text-sm font-semibold">Windows</div>
          <div class="text-xs text-[var(--app-muted)]">
            Context from window titles and focus events.
          </div>
        </div>
        <div
          class="rounded-lg px-3 py-2"
          :style="{ background: 'var(--app-surface-soft)' }"
        >
          <div class="text-sm font-semibold">Activity</div>
          <div class="text-xs text-[var(--app-muted)]">
            Keyboard and mouse activity windows.
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import packageInfo from '../../../release/app/package.json';

const LogoMark = {
  template: `<svg viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M87.6445 104.513H59.248L65.2676 87.3047H80.9707L57.7432 27.1748H85.9434L120.556 114H91.3086L87.6445 104.513ZM51.5273 114H23.5889L54.6025 31.1006L67.4268 65.582L51.5273 114Z" fill="currentColor"/>
  </svg>`,
};
</script>
