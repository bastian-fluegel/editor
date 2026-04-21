import { computed, reactive } from 'vue'
import { newId } from './id'
import type { DragState, EditorNode, Link, LinkKind, NodeParamRef, NodeType, Param } from './types'

type EditorState = {
  nodes: EditorNode[]
  links: Link[]
  selectedNodeId: string | null
  selectedLinkId: string | null
  drag: DragState
  status: string
}

function defaultCode(type: NodeType): string {
  if (type === 'object') {
    return `# object code\n\ndef build():\n    return {}\n`
  }
  return `# action code\n\ndef run(ctx):\n    return ctx\n`
}

export function useEditorStore() {
  const state = reactive<EditorState>({
    nodes: [],
    links: [],
    selectedNodeId: null,
    selectedLinkId: null,
    drag: { kind: 'none' },
    status: 'Ready',
  })

  const nodesById = computed(() => new Map(state.nodes.map((n) => [n.id, n] as const)))
  const linksById = computed(() => new Map(state.links.map((l) => [l.id, l] as const)))

  const selectedNode = computed(() =>
    state.selectedNodeId ? nodesById.value.get(state.selectedNodeId) ?? null : null,
  )

  function selectNode(nodeId: string | null) {
    state.selectedNodeId = nodeId
    if (nodeId) state.selectedLinkId = null
  }

  function selectLink(linkId: string | null) {
    state.selectedLinkId = linkId
    if (linkId) state.selectedNodeId = null
  }

  function addNode(type: NodeType) {
    const id = newId('node')
    const node: EditorNode = {
      id,
      type,
      name: type === 'object' ? 'Object' : 'Action',
      x: 80 + state.nodes.length * 30,
      y: 80 + state.nodes.length * 24,
      params: [],
      code: defaultCode(type),
    }
    state.nodes.push(node)
    state.status = `Added ${type}`
    selectNode(id)
  }

  function deleteSelected() {
    if (state.selectedNodeId) {
      const id = state.selectedNodeId
      state.nodes = state.nodes.filter((n) => n.id !== id)
      state.links = state.links.filter((l) => l.from.nodeId !== id && l.to.nodeId !== id)
      state.selectedNodeId = null
      state.status = 'Deleted node'
      return
    }
    if (state.selectedLinkId) {
      const id = state.selectedLinkId
      state.links = state.links.filter((l) => l.id !== id)
      state.selectedLinkId = null
      state.status = 'Deleted link'
    }
  }

  function upsertParam(nodeId: string, param: Param) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    const idx = node.params.findIndex((p) => p.id === param.id)
    if (idx === -1) node.params.push(param)
    else node.params[idx] = param
  }

  function addParam(nodeId: string) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    node.params.push({
      id: newId('param'),
      name: `param_${node.params.length + 1}`,
      io: node.type === 'action' ? 'in' : undefined,
    })
    state.status = 'Added param'
  }

  function removeParam(nodeId: string, paramId: string) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    node.params = node.params.filter((p) => p.id !== paramId)
    state.links = state.links.filter((l) => l.from.paramId !== paramId && l.to.paramId !== paramId)
    state.status = 'Removed param'
  }

  function setNodeName(nodeId: string, name: string) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    node.name = name
  }

  function setNodeCode(nodeId: string, code: string) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    node.code = code
  }

  function setNodePosition(nodeId: string, x: number, y: number) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    node.x = x
    node.y = y
  }

  function beginNodeDrag(nodeId: string, grabDx: number, grabDy: number) {
    state.drag = { kind: 'node', nodeId, grabDx, grabDy }
  }

  function beginLinkDrag(from: NodeParamRef, kind: LinkKind) {
    state.drag = { kind: 'link', from: { ...from, kind }, cursorX: 0, cursorY: 0 }
    state.status = 'Connecting…'
  }

  function updateCursor(x: number, y: number) {
    if (state.drag.kind === 'link') {
      state.drag.cursorX = x
      state.drag.cursorY = y
    }
  }

  function endDrag() {
    state.drag = { kind: 'none' }
    state.status = 'Ready'
  }

  function addLink(kind: LinkKind, from: NodeParamRef, to: NodeParamRef) {
    // normalize: ensure from=out, to=in (allow starting/ending on either side)
    if (from.side === 'in' && to.side === 'out') {
      const tmp = from
      from = to
      to = tmp
    }
    if (from.side !== 'out' || to.side !== 'in') return
    // prevent duplicates
    const exists = state.links.some(
      (l) =>
        l.kind === kind &&
        l.from.nodeId === from.nodeId &&
        l.from.paramId === from.paramId &&
        l.to.nodeId === to.nodeId &&
        l.to.paramId === to.paramId,
    )
    if (exists) return
    state.links.push({
      id: newId('link'),
      kind,
      from,
      to,
    })
    state.status = `Linked (${kind})`
    selectLink(state.links[state.links.length - 1]?.id ?? null)
  }

  function deleteLink(linkId: string) {
    state.links = state.links.filter((l) => l.id !== linkId)
    if (state.selectedLinkId === linkId) state.selectedLinkId = null
    state.status = 'Deleted link'
  }

  return {
    state,
    nodesById,
    linksById,
    selectedNode,
    selectNode,
    selectLink,
    addNode,
    deleteSelected,
    addParam,
    upsertParam,
    removeParam,
    setNodeName,
    setNodeCode,
    setNodePosition,
    beginNodeDrag,
    beginLinkDrag,
    updateCursor,
    endDrag,
    addLink,
    deleteLink,
  }
}

