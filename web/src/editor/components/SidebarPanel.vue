<script setup lang="ts">
import type { EditorNode, Param } from '../types'

defineProps<{
  node: EditorNode | null
}>()

const emit = defineEmits<{
  (e: 'set-name', nodeId: string, name: string): void
  (e: 'set-code', nodeId: string, code: string): void
  (e: 'add-param', nodeId: string): void
  (e: 'remove-param', nodeId: string, paramId: string): void
  (e: 'upsert-param', nodeId: string, param: Param): void
}>()
</script>

<template>
  <aside class="h-full flex flex-col">
    <div class="px-4 py-3 border-b border-white/10">
      <div class="text-sm font-semibold text-white/90">Eigenschaften</div>
      <div class="text-xs text-white/50">
        <template v-if="node">{{ node.type }} • {{ node.id.slice(0, 10) }}</template>
        <template v-else>Wähle eine Box im Canvas.</template>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div v-if="!node" class="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
        Noch keine Auswahl.
      </div>

      <div v-else class="space-y-4">
        <div class="rounded-lg border border-white/10 bg-white/5 p-3">
          <label class="block text-xs text-white/50 mb-1">Name</label>
          <input
            class="w-full rounded-md border border-white/10 bg-zinc-950/40 px-2.5 py-2 text-sm text-white/90 outline-none focus:border-cyan-300/40"
            :value="node.name"
            type="text"
            @input="emit('set-name', node.id, ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="rounded-lg border border-white/10 bg-white/5 p-3">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-sm font-semibold text-white/85">Parameter</div>
              <div class="text-xs text-white/45">
                <template v-if="node.type === 'object'">
                  Objekt-Parameter (get/set)
                </template>
                <template v-else>
                  Lokale Variablen für die Action
                </template>
              </div>
            </div>
            <button
              class="rounded-md border border-white/10 bg-zinc-950/30 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
              type="button"
              @click="emit('add-param', node.id)"
            >
              +
            </button>
          </div>

          <div v-if="node.params.length === 0" class="text-xs text-white/45">Keine Parameter.</div>

          <div v-else class="space-y-2">
            <div
              v-for="p in node.params"
              :key="p.id"
              class="flex items-center gap-2 rounded-md border border-white/10 bg-zinc-950/20 px-2 py-1.5"
            >
              <select
                v-if="node.type === 'action'"
                class="rounded border border-white/10 bg-zinc-950/40 px-2 py-1 text-[11px] text-white/70 outline-none focus:border-cyan-300/40"
                :value="p.io ?? 'in'"
                @change="
                  emit('upsert-param', node.id, {
                    id: p.id,
                    name: p.name,
                    io: (($event.target as HTMLSelectElement).value as 'in' | 'out'),
                  })
                "
                title="sender/receiver"
              >
                <option value="in">Empfänger</option>
                <option value="out">Sender</option>
              </select>
              <input
                class="min-w-0 flex-1 rounded border border-white/10 bg-zinc-950/40 px-2 py-1 text-xs text-white/85 outline-none focus:border-cyan-300/40"
                :value="p.name"
                type="text"
                @input="
                  emit('upsert-param', node.id, {
                    id: p.id,
                    name: ($event.target as HTMLInputElement).value,
                    io: p.io,
                  })
                "
              />
              <button
                class="rounded border border-white/10 bg-zinc-950/40 px-2 py-1 text-xs text-white/60 hover:bg-white/10"
                type="button"
                title="remove"
                @click="emit('remove-param', node.id, p.id)"
              >
                –
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-white/10 bg-white/5 p-3">
          <label class="block text-sm font-semibold text-white/85 mb-2">Python Code</label>
          <textarea
            class="h-72 w-full resize-y rounded-md border border-white/10 bg-zinc-950/40 px-3 py-2 font-mono text-xs text-white/85 outline-none focus:border-fuchsia-400/40"
            spellcheck="false"
            :value="node.code"
            @input="emit('set-code', node.id, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>
  </aside>
</template>

