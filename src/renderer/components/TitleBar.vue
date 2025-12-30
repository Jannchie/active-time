<template>
  <UDashboardNavbar class="drag-region" :toggle="true">
    <template #toggle>
      <UDashboardSidebarToggle class="no-drag" size="xs" />
    </template>
    <template #left>
      <div class="flex items-center gap-2">
        <div
          class="flex h-7 w-7 items-center justify-center rounded-md border bg-muted"
        >
          <UIcon name="i-lucide-timer" class="h-4 w-4" />
        </div>
        <div class="text-sm font-semibold">
          Active Time
        </div>
      </div>
    </template>
  </UDashboardNavbar>
</template>
