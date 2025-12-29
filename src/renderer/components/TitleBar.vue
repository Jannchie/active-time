<template>
  <UDashboardNavbar class="drag-region" :toggle="true">
    <template #toggle>
      <UDashboardSidebarToggle class="no-drag" size="xs" />
    </template>
    <template #left>
      <div class="flex items-center gap-2">
        <div
          class="flex h-7 w-7 items-center justify-center rounded-md border text-[var(--app-text)]"
          :style="{
            background: 'var(--app-surface-soft)',
            borderColor: 'var(--app-border)',
          }"
        >
          <UIcon name="i-lucide-timer" class="h-4 w-4" />
        </div>
        <div class="text-sm font-semibold text-[var(--app-text)]">
          Active Time
        </div>
      </div>
    </template>
  </UDashboardNavbar>
</template>
