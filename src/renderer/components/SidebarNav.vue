<template>
  <nav class="flex flex-col gap-1">
    <UButton
      v-for="item in items"
      :key="item.key"
      class="no-drag gap-2"
      :class="collapsed ? 'h-7 w-7 justify-center' : 'h-7 w-full justify-start px-2'"
      size="xs"
      :variant="modelValue === item.key ? 'soft' : 'ghost'"
      color="neutral"
      :square="collapsed"
      @click="emit('update:modelValue', item.key)"
    >
      <UIcon
        :name="item.icon"
        class="h-3.5 w-3.5"
        :class="modelValue === item.key ? 'text-emerald-500' : 'text-muted'"
      />
      <span v-if="!collapsed" class="text-xs">{{ item.label }}</span>
    </UButton>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{ modelValue: string; collapsed?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const { t } = useI18n();

const items = computed(() => [
  { key: 'dashboard', icon: 'i-lucide-activity', label: t('nav.dashboard') },
  { key: 'processes', icon: 'i-lucide-app-window', label: t('nav.processes') },
  { key: 'settings', icon: 'i-lucide-sliders-horizontal', label: t('nav.settings') },
  { key: 'about', icon: 'i-lucide-info', label: t('nav.about') },
]);
</script>
