<script setup lang="ts">
defineProps<{
  canDelete: boolean
}>()

const emit = defineEmits<{
  (e: 'add-object'): void
  (e: 'add-action'): void
  (e: 'delete-selected'): void
}>()
</script>

<template>
  <div class="h-12 shrink-0 border-b border-white/10 bg-zinc-950/40">
    <div class="h-full px-3 flex items-center gap-2">
      <button
        class="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
        type="button"
        @click="emit('add-object')"
      >
        + Objekt
      </button>
      <button
        class="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
        type="button"
        @click="emit('add-action')"
      >
        + Action
      </button>
      <div class="w-px h-6 bg-white/10 mx-1" />
      <button
        class="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10"
        :class="canDelete ? 'bg-white/5 text-white/80' : 'bg-transparent text-white/30 cursor-not-allowed'"
        type="button"
        :disabled="!canDelete"
        @click="emit('delete-selected')"
      >
        Löschen
      </button>

      <div class="ml-auto flex items-center gap-2">
        <div class="text-xs text-white/50">Tip</div>
        <div class="text-xs text-white/60">Drag nodes • Connect via dots • Del löscht</div>
      </div>
    </div>
  </div>
</template>

