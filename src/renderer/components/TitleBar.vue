<template>
  <UDashboardNavbar class="drag-region" :toggle="true">
    <template #toggle>
      <UDashboardSidebarToggle
        class="no-drag opacity-70 hover:opacity-100 lg:hidden"
        size="xs"
      />
    </template>
    <template #left>
      <div class="text-sm font-semibold">
        Active Time
      </div>
    </template>
  </UDashboardNavbar>
</template>
