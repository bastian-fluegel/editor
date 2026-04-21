<script setup lang="ts">
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { DragState, EditorNode, Link } from '../types'
import { getHandlePoint, linkColor, manhattanPath } from '../geometry'

const props = defineProps<{
  nodesById: ComputedRef<Map<string, EditorNode>>
  links: Link[]
  drag: DragState
}>()

const emit = defineEmits<{
  (e: 'delete-link', linkId: string): void
}>()

const paths = computed(() => {
  const byId = props.nodesById.value
  return props.links
    .map((l) => {
      const a = getHandlePoint(byId, l.from)
      const b = getHandlePoint(byId, l.to)
      if (!a || !b) return null
      return { id: l.id, d: manhattanPath(a, b), color: linkColor(l.kind), kind: l.kind }
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
})

const preview = computed(() => {
  if (props.drag.kind !== 'link') return null
  const byId = props.nodesById.value
  const a = getHandlePoint(byId, props.drag.from)
  if (!a) return null
  const b = { x: props.drag.cursorX, y: props.drag.cursorY }
  return { d: manhattanPath(a, b), color: linkColor(props.drag.from.kind) }
})
</script>

<template>
  <svg class="absolute inset-0 pointer-events-none" aria-hidden="true">
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.6" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g>
      <path
        v-for="p in paths"
        :key="p.id"
        :d="p.d"
        :stroke="p.color"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.9"
        filter="url(#glow)"
      />

      <path
        v-if="preview"
        :d="preview.d"
        :stroke="preview.color"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.55"
        stroke-dasharray="6 6"
      />
    </g>
  </svg>

  <!-- Click-capture layer for deleting links (very minimal) -->
  <div class="absolute inset-0">
    <button
      v-for="p in paths"
      :key="p.id + '_btn'"
      class="absolute pointer-events-auto"
      type="button"
      :style="{ left: '-9999px', top: '-9999px' }"
      @click="emit('delete-link', p.id)"
    />
  </div>
</template>

