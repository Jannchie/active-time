<template>
  <nav class="flex flex-col gap-1">
    <UButton
      v-for="item in items"
      :key="item.key"
      class="no-drag gap-2"
      :class="collapsed ? 'h-9 w-9 justify-center' : 'h-9 w-full justify-start'"
      size="sm"
      :variant="modelValue === item.key ? 'solid' : 'ghost'"
      color="neutral"
      :square="collapsed"
      @click="emit('update:modelValue', item.key)"
    >
      <UIcon :name="item.icon" class="h-4 w-4" />
      <span v-if="!collapsed" class="text-sm">{{ item.label }}</span>
    </UButton>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; collapsed?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const items = [
  { key: 'dashboard', icon: 'i-lucide-activity', label: 'Dashboard' },
  { key: 'settings', icon: 'i-lucide-sliders-horizontal', label: 'Settings' },
  { key: 'about', icon: 'i-lucide-info', label: 'About' },
];
</script>
