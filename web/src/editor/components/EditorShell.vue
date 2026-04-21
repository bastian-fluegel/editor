<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useEditorStore } from '../store'
import MenuBar from './MenuBar.vue'
import ToolBar from './ToolBar.vue'
import CanvasView from './CanvasView.vue'
import SidebarPanel from './SidebarPanel.vue'
import StatusBar from './StatusBar.vue'

const editor = useEditorStore()

const nodeCount = computed(() => editor.state.nodes.length)
const linkCount = computed(() => editor.state.links.length)

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    editor.deleteSelected()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    editor.addNode('object')
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="h-full flex flex-col">
    <MenuBar />
    <ToolBar
      :can-delete="!!editor.state.selectedNodeId"
      @add-object="editor.addNode('object')"
      @add-action="editor.addNode('action')"
      @delete-selected="editor.deleteSelected()"
    />

    <main class="min-h-0 flex-1 flex">
      <CanvasView
        :state="editor.state"
        :nodes-by-id="editor.nodesById"
        @select-node="editor.selectNode"
        @select-link="editor.selectLink"
        @begin-node-drag="editor.beginNodeDrag"
        @set-node-position="editor.setNodePosition"
        @begin-link-drag="editor.beginLinkDrag"
        @add-link="editor.addLink"
        @delete-link="editor.deleteLink"
        @update-cursor="editor.updateCursor"
        @end-drag="editor.endDrag"
      />

      <SidebarPanel
        class="shrink-0 border-l border-white/10 bg-zinc-950/50 min-w-[280px] max-w-[520px] w-[360px] resize-x overflow-auto"
        :node="editor.selectedNode.value"
        @set-name="editor.setNodeName"
        @set-code="editor.setNodeCode"
        @add-param="editor.addParam"
        @remove-param="editor.removeParam"
        @upsert-param="editor.upsertParam"
      />
    </main>

    <StatusBar :status="editor.state.status" :nodes="nodeCount" :links="linkCount" />
  </div>
</template>

