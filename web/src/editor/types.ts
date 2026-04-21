export type NodeType = 'object' | 'action'

export type ParamIO = 'in' | 'out'

export type Param = {
  id: string
  name: string
  /**
   * Only meaningful for action parameters:
   * - in: receiver (set)
   * - out: sender (get)
   */
  io?: ParamIO
}

export type EditorNode = {
  id: string
  type: NodeType
  name: string
  x: number
  y: number
  params: Param[]
  code: string
}

export type LinkKind = 'get' | 'set'

export type NodeParamRef = {
  nodeId: string
  paramId: string
  side: 'in' | 'out'
}

export type Link = {
  id: string
  kind: LinkKind
  from: NodeParamRef
  to: NodeParamRef
}

export type DragState =
  | { kind: 'none' }
  | { kind: 'node'; nodeId: string; grabDx: number; grabDy: number }
  | { kind: 'link'; from: NodeParamRef & { kind: LinkKind }; cursorX: number; cursorY: number }

