import type { Bounds, WireframeComponent } from '../types/component'

type SnapGuide = {
    readonly orientation: 'horizontal' | 'vertical'
    readonly position: number
}

const SNAP_THRESHOLD = 6

export function computeSnapGuides(
    dragging: Bounds,
    others: readonly WireframeComponent[],
): { guides: readonly SnapGuide[]; snappedX: number; snappedY: number } {
    const guides: SnapGuide[] = []
    let snappedX = dragging.x
    let snappedY = dragging.y

    const dragCenterX = dragging.x + dragging.width / 2
    const dragCenterY = dragging.y + dragging.height / 2
    const dragRight = dragging.x + dragging.width
    const dragBottom = dragging.y + dragging.height

    let closestDx = SNAP_THRESHOLD + 1
    let closestDy = SNAP_THRESHOLD + 1

    for (const other of others) {
        const otherCenterX = other.bounds.x + other.bounds.width / 2
        const otherCenterY = other.bounds.y + other.bounds.height / 2
        const otherRight = other.bounds.x + other.bounds.width
        const otherBottom = other.bounds.y + other.bounds.height

        const verticalEdges = [
            { target: other.bounds.x, source: dragging.x, label: 'left-left' },
            { target: otherRight, source: dragRight, label: 'right-right' },
            { target: other.bounds.x, source: dragRight, label: 'right-left' },
            { target: otherRight, source: dragging.x, label: 'left-right' },
            { target: otherCenterX, source: dragCenterX, label: 'center-center' },
        ]

        for (const edge of verticalEdges) {
            const dx = Math.abs(edge.target - edge.source)
            if (dx < SNAP_THRESHOLD && dx < closestDx) {
                closestDx = dx
                snappedX = dragging.x + (edge.target - edge.source)
                guides.push({ orientation: 'vertical', position: edge.target })
            }
        }

        const horizontalEdges = [
            { target: other.bounds.y, source: dragging.y, label: 'top-top' },
            { target: otherBottom, source: dragBottom, label: 'bottom-bottom' },
            { target: other.bounds.y, source: dragBottom, label: 'bottom-top' },
            { target: otherBottom, source: dragging.y, label: 'top-bottom' },
            { target: otherCenterY, source: dragCenterY, label: 'center-center' },
        ]

        for (const edge of horizontalEdges) {
            const dy = Math.abs(edge.target - edge.source)
            if (dy < SNAP_THRESHOLD && dy < closestDy) {
                closestDy = dy
                snappedY = dragging.y + (edge.target - edge.source)
                guides.push({ orientation: 'horizontal', position: edge.target })
            }
        }
    }

    return { guides, snappedX, snappedY }
}

export function snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize
}
