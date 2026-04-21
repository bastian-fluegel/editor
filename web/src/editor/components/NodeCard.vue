<script setup lang="ts">
import type { EditorNode, LinkKind, NodeParamRef } from '../types'
import { NODE_HEADER_H, NODE_PADDING_Y, NODE_W, PARAM_ROW_H } from '../geometry'

const props = defineProps<{
  node: EditorNode
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'begin-drag', payload: { grabDx: number; grabDy: number }): void
  (e: 'begin-link-drag', payload: { ref: NodeParamRef; kind: LinkKind }): void
}>()

function onPointerDownHeader(e: PointerEvent) {
  emit('select')
  const target = e.currentTarget as HTMLElement
  const card = target.closest('[data-node-card]') as HTMLElement | null
  if (!card) return
  const rect = card.getBoundingClientRect()
  emit('begin-drag', { grabDx: e.clientX - rect.left, grabDy: e.clientY - rect.top })
}

function onHandlePointerDown(e: PointerEvent, paramId: string, side: 'in' | 'out', kind: LinkKind) {
  e.stopPropagation()
  emit('select')
  emit('begin-link-drag', { ref: { nodeId: props.node.id, paramId, side }, kind })
}
</script>

<template>
  <div
    data-node-card
    class="absolute select-none"
    :style="{ transform: `translate(${node.x}px, ${node.y}px)` }"
    @pointerdown="emit('select')"
  >
    <div
      class="rounded-xl border shadow-[0_16px_40px_-22px_rgba(0,0,0,0.85)]"
      :class="
        selected
          ? 'border-fuchsia-400/40 bg-zinc-950/85 ring-1 ring-cyan-300/20'
          : 'border-white/10 bg-zinc-950/70'
      "
      :style="{ width: NODE_W + 'px' }"
    >
      <div
        class="flex items-center justify-between px-3"
        :style="{ height: NODE_HEADER_H + 'px' }"
        @pointerdown="onPointerDownHeader"
      >
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="h-2.5 w-2.5 rounded-full"
            :class="node.type === 'object' ? 'bg-cyan-300/80' : 'bg-fuchsia-400/80'"
          />
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-white/90">{{ node.name }}</div>
          </div>
        </div>
        <div class="text-[11px] text-white/45 uppercase tracking-wider">
          {{ node.type }}
        </div>
      </div>

      <div class="px-3 pb-3" :style="{ paddingTop: NODE_PADDING_Y + 'px' }">
        <div v-if="node.params.length === 0" class="text-xs text-white/40">
          Keine Parameter. (Sidebar → +)
        </div>

        <div
          v-for="(p, idx) in node.params"
          :key="p.id"
          class="relative flex items-center justify-between gap-2 rounded-md px-2 text-xs"
          :class="selected ? 'bg-white/5' : 'bg-white/0'"
          :style="{ height: PARAM_ROW_H + 'px', marginTop: idx === 0 ? '0px' : '6px' }"
        >
          <!-- IN (set) - objects always, actions only if receiver -->
          <button
            v-if="node.type === 'object' || p.io !== 'out'"
            data-handle
            class="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-white/15 bg-zinc-950 hover:border-fuchsia-300/60"
            :data-node-id="node.id"
            :data-param-id="p.id"
            data-side="in"
            type="button"
            :title="node.type === 'action' ? 'receiver (set)' : 'set'"
            @pointerdown="onHandlePointerDown($event, p.id, 'in', 'set')"
          >
            <span class="sr-only">set</span>
          </button>

          <div class="truncate text-white/75">{{ p.name }}</div>

          <!-- OUT (get) - objects always, actions only if sender -->
          <button
            v-if="node.type === 'object' || p.io === 'out'"
            data-handle
            class="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-white/15 bg-zinc-950 hover:border-cyan-200/70"
            :data-node-id="node.id"
            :data-param-id="p.id"
            data-side="out"
            type="button"
            :title="node.type === 'action' ? 'sender (get)' : 'get'"
            @pointerdown="onHandlePointerDown($event, p.id, 'out', 'get')"
          >
            <span class="sr-only">get</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

