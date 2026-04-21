<script setup lang="ts">
defineProps<{
  status: string
  nodes: number
  links: number
}>()
</script>

<template>
  <footer class="h-9 shrink-0 border-t border-white/10 bg-zinc-950/60">
    <div class="h-full px-3 flex items-center justify-between text-xs text-white/60">
      <div class="flex items-center gap-3">
        <span>{{ status }}</span>
        <span class="text-white/30">|</span>
        <span>Nodes: {{ nodes }}</span>
        <span class="text-white/30">|</span>
        <span>Links: {{ links }}</span>
      </div>
      <div class="font-mono text-white/40">web</div>
    </div>
  </footer>
</template>

