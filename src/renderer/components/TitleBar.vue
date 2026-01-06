<template>
  <UDashboardNavbar class="drag-region" :toggle="true">
    <template #toggle>
      <UDashboardSidebarToggle
        class="no-drag opacity-70 hover:opacity-100 lg:hidden"
        size="xs"
      />
    </template>
    <template #leading>
      <UDashboardSidebarCollapse
        class="no-drag opacity-70 hover:opacity-100"
        size="xs"
      />
    </template>
    <template #title>
      <span class="text-sm font-semibold">
        {{ t('app.name') }}
      </span>
    </template>
  </UDashboardNavbar>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
