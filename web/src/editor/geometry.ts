import type { EditorNode, LinkKind, NodeParamRef } from './types'

export const NODE_W = 280
export const NODE_HEADER_H = 38
export const NODE_PADDING_Y = 10
export const PARAM_ROW_H = 28
export const HANDLE_R = 5
export const HANDLE_PAD_X = 10

export type Point = { x: number; y: number }

export function getParamIndex(node: EditorNode, paramId: string): number {
  return Math.max(
    0,
    node.params.findIndex((p) => p.id === paramId),
  )
}

export function getHandlePoint(nodesById: Map<string, EditorNode>, ref: NodeParamRef): Point | null {
  const node = nodesById.get(ref.nodeId)
  if (!node) return null
  const idx = getParamIndex(node, ref.paramId)
  const y =
    node.y +
    NODE_HEADER_H +
    NODE_PADDING_Y +
    idx * PARAM_ROW_H +
    Math.floor(PARAM_ROW_H / 2)
  const x =
    ref.side === 'out'
      ? node.x + NODE_W + HANDLE_PAD_X
      : node.x - HANDLE_PAD_X
  return { x, y }
}

export function manhattanPath(a: Point, b: Point): string {
  // Simple 2-bend orthogonal route, stable and readable.
  const midX = a.x + (b.x - a.x) * 0.5
  const p1: Point = { x: midX, y: a.y }
  const p2: Point = { x: midX, y: b.y }
  return `M ${a.x} ${a.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${b.x} ${b.y}`
}

export function linkColor(kind: LinkKind): string {
  return kind === 'get' ? 'rgba(34,211,238,0.85)' : 'rgba(217,70,239,0.85)'
}

