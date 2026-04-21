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

const AUTO_SIG_OPEN = '# <auto:signature>'
const AUTO_SIG_CLOSE = '# </auto:signature>'
const AUTO_BODY_OPEN = '# <auto:body>'
const AUTO_BODY_CLOSE = '# </auto:body>'
const AUTO_RET_OPEN = '# <auto:return>'
const AUTO_RET_CLOSE = '# </auto:return>'

function sanitizePyIdentifier(raw: string): string {
  const s = raw
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (!s) return 'x'
  if (/^[0-9]/.test(s)) return `x_${s}`
  return s
}

function hasAutoBlocks(code: string): boolean {
  return (
    code.includes(AUTO_SIG_OPEN) &&
    code.includes(AUTO_SIG_CLOSE) &&
    code.includes(AUTO_BODY_OPEN) &&
    code.includes(AUTO_BODY_CLOSE) &&
    code.includes(AUTO_RET_OPEN) &&
    code.includes(AUTO_RET_CLOSE)
  )
}

function extractBlock(code: string, open: string, close: string): string | null {
  const a = code.indexOf(open)
  const b = code.indexOf(close)
  if (a === -1 || b === -1 || b <= a) return null
  return code.slice(a + open.length, b).replace(/^\s*\n/, '').replace(/\n\s*$/, '')
}

function buildActionCode(node: EditorNode, previous?: string): string {
  const funcName = sanitizePyIdentifier(node.name || 'action')
  const inputs = node.params.filter((p) => (p.io ?? 'in') === 'in')
  const outputs = node.params.filter((p) => (p.io ?? 'in') === 'out')

  const used = new Set<string>()
  const inNames = inputs.map((p) => {
    let n = sanitizePyIdentifier(p.name)
    while (used.has(n)) n = `${n}_`
    used.add(n)
    return n
  })
  const outNames = outputs.map((p) => {
    let n = sanitizePyIdentifier(p.name)
    while (used.has(n)) n = `${n}_`
    used.add(n)
    return n
  })

  const bodyFromPrev =
    (previous && extractBlock(previous, AUTO_BODY_OPEN, AUTO_BODY_CLOSE)) || '    # code here'

  const ret =
    outNames.length === 0
      ? '    return {}'
      : `    return { ${outNames.map((n) => `"${n}": ${n}`).join(', ')} }`

  return [
    AUTO_SIG_OPEN,
    `def ${funcName}(${inNames.join(', ')}):`,
    '    """',
    '    Action = Python-Funktion.',
    '    - Eingänge: Empfänger-Parameter (in)',
    '    - Ausgänge: Sender-Parameter (out) als dict',
    '    """',
    AUTO_SIG_CLOSE,
    '',
    AUTO_BODY_OPEN,
    bodyFromPrev,
    AUTO_BODY_CLOSE,
    '',
    AUTO_RET_OPEN,
    ret,
    AUTO_RET_CLOSE,
    '',
  ].join('\n')
}

function defaultCode(type: NodeType): string {
  if (type === 'object') {
    return `# object code\n\ndef build():\n    return {}\n`
  }
  // Action code is auto-updatable as long as the markers stay intact.
  return buildActionCode({
    id: 'tmp',
    type: 'action',
    name: 'Action',
    x: 0,
    y: 0,
    params: [],
    code: '',
  })
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
    if (node.type === 'action' && hasAutoBlocks(node.code)) {
      node.code = buildActionCode(node, node.code)
    }
  }

  function addParam(nodeId: string) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    node.params.push({
      id: newId('param'),
      name: `param_${node.params.length + 1}`,
      io: node.type === 'action' ? 'in' : undefined,
    })
    if (node.type === 'action' && hasAutoBlocks(node.code)) {
      node.code = buildActionCode(node, node.code)
    }
    state.status = 'Added param'
  }

  function removeParam(nodeId: string, paramId: string) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    node.params = node.params.filter((p) => p.id !== paramId)
    state.links = state.links.filter((l) => l.from.paramId !== paramId && l.to.paramId !== paramId)
    if (node.type === 'action' && hasAutoBlocks(node.code)) {
      node.code = buildActionCode(node, node.code)
    }
    state.status = 'Removed param'
  }

  function setNodeName(nodeId: string, name: string) {
    const node = nodesById.value.get(nodeId)
    if (!node) return
    node.name = name
    if (node.type === 'action' && hasAutoBlocks(node.code)) {
      node.code = buildActionCode(node, node.code)
    }
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

