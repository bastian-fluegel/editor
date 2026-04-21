<script setup lang="ts">
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { DragState, EditorNode, Link } from '../types'
import { getHandlePoint, linkColor, manhattanPath } from '../geometry'

const props = defineProps<{
  nodesById: ComputedRef<Map<string, EditorNode>>
  links: Link[]
  drag: DragState
  selectedLinkId: string | null
}>()

const emit = defineEmits<{
  (e: 'select-link', linkId: string | null): void
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
  <svg class="absolute inset-0" aria-hidden="true">
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
      <g v-for="p in paths" :key="p.id">
        <!-- Hit area -->
        <path
          :d="p.d"
          stroke="transparent"
          stroke-width="14"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="cursor-pointer"
          @pointerdown.stop="emit('select-link', p.id)"
          @dblclick.stop="emit('delete-link', p.id)"
        />

        <!-- Visible link -->
        <path
          :d="p.d"
          :stroke="p.color"
          :stroke-width="p.id === selectedLinkId ? 3.5 : 2.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          :opacity="p.id === selectedLinkId ? 1 : 0.9"
          filter="url(#glow)"
          class="pointer-events-none"
        />
      </g>

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
        class="pointer-events-none"
      />
    </g>
  </svg>
</template>

