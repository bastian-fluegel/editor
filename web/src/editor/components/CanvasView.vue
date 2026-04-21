<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ComputedRef } from 'vue'
import type { DragState, EditorNode, Link, LinkKind, NodeParamRef } from '../types'
import { NODE_W } from '../geometry'
import NodeCard from './NodeCard.vue'
import ConnectionsLayer from './ConnectionsLayer.vue'

const props = defineProps<{
  state: {
    nodes: EditorNode[]
    links: Link[]
    selectedNodeId: string | null
    drag: DragState
  }
  nodesById: ComputedRef<Map<string, EditorNode>>
}>()

const emit = defineEmits<{
  (e: 'select-node', nodeId: string | null): void
  (e: 'begin-node-drag', nodeId: string, grabDx: number, grabDy: number): void
  (e: 'set-node-position', nodeId: string, x: number, y: number): void
  (e: 'begin-link-drag', from: NodeParamRef, kind: LinkKind): void
  (e: 'add-link', kind: LinkKind, from: NodeParamRef, to: NodeParamRef): void
  (e: 'delete-link', linkId: string): void
  (e: 'update-cursor', x: number, y: number): void
  (e: 'end-drag'): void
}>()

const rootRef = ref<HTMLDivElement | null>(null)
const viewportRect = computed(() => rootRef.value?.getBoundingClientRect() ?? null)

function canvasPointFromEvent(e: PointerEvent): { x: number; y: number } | null {
  const rect = viewportRect.value
  if (!rect) return null
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onBackgroundPointerDown() {
  emit('select-node', null)
}

function onGlobalPointerMove(e: PointerEvent) {
  const p = canvasPointFromEvent(e)
  if (!p) return

  if (props.state.drag.kind === 'node') {
    const d = props.state.drag
    emit('set-node-position', d.nodeId, p.x - d.grabDx, p.y - d.grabDy)
  } else if (props.state.drag.kind === 'link') {
    emit('update-cursor', p.x, p.y)
  }
}

function onGlobalPointerUp(e: PointerEvent) {
  if (props.state.drag.kind !== 'link') {
    emit('end-drag')
    return
  }

  const target = (e.target as HTMLElement | null)?.closest?.('[data-handle]') as HTMLElement | null
  const drag = props.state.drag
  if (!target) {
    emit('end-drag')
    return
  }

  const nodeId = target.getAttribute('data-node-id')
  const paramId = target.getAttribute('data-param-id')
  const side = target.getAttribute('data-side') as 'in' | 'out' | null
  if (!nodeId || !paramId || !side) {
    emit('end-drag')
    return
  }

  const to: NodeParamRef = { nodeId, paramId, side }
  emit('add-link', drag.from.kind, { nodeId: drag.from.nodeId, paramId: drag.from.paramId, side: drag.from.side }, to)
  emit('end-drag')
}

onMounted(() => {
  window.addEventListener('pointermove', onGlobalPointerMove)
  window.addEventListener('pointerup', onGlobalPointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onGlobalPointerMove)
  window.removeEventListener('pointerup', onGlobalPointerUp)
})

const boundsHint = computed(() => ({
  w: Math.max(900, ...props.state.nodes.map((n) => n.x + NODE_W + 200)),
  h: Math.max(600, ...props.state.nodes.map((n) => n.y + 420)),
}))
</script>

<template>
  <section ref="rootRef" class="min-w-0 flex-1 relative overflow-hidden">
    <div class="absolute inset-0 tech-grid opacity-70" />
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(217,70,239,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.12),transparent_40%)]"
    />

    <div class="absolute inset-0 p-4">
      <div
        class="h-full w-full rounded-xl border border-white/10 bg-black/20 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] overflow-hidden"
        @pointerdown.self="onBackgroundPointerDown"
      >
        <div
          class="relative h-full w-full"
          :style="{ width: boundsHint.w + 'px', height: boundsHint.h + 'px' }"
        >
          <ConnectionsLayer
            :nodes-by-id="nodesById"
            :links="state.links"
            :drag="state.drag"
            @delete-link="emit('delete-link', $event)"
          />

          <NodeCard
            v-for="n in state.nodes"
            :key="n.id"
            :node="n"
            :selected="n.id === state.selectedNodeId"
            @select="emit('select-node', n.id)"
            @begin-drag="emit('begin-node-drag', n.id, $event.grabDx, $event.grabDy)"
            @begin-link-drag="emit('begin-link-drag', $event.ref, $event.kind)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
