import { useCallback, useRef, useState } from 'react'
import type { ComponentId } from '../types/component'
import { useCanvasStore } from '../store/canvas-store'

type PointerHandler = (e: PointerEvent) => void

type LayerDragState = {
    readonly draggedId: ComponentId | null
    readonly dropIndex: number | null
}

const IDLE_DRAG_STATE: LayerDragState = { draggedId: null, dropIndex: null }
const DRAG_THRESHOLD_PX = 4

/**
 * Manages pointer-based drag-to-reorder for the layers panel.
 *
 * The layers panel displays items sorted by descending zIndex (visual index 0 = highest zIndex = front).
 * This hook converts between visual indices and ascending zIndex indices used by the store.
 */
export function useLayerDrag(sortedCount: number) {
    const [dragState, setDragState] = useState<LayerDragState>(IDLE_DRAG_STATE)

    const startYRef = useRef(0)
    const isDraggingRef = useRef(false)
    const draggedIdRef = useRef<ComponentId | null>(null)
    const dropIndexRef = useRef<number | null>(null)
    const rowRectsRef = useRef<DOMRect[]>([])
    const containerRef = useRef<HTMLDivElement | null>(null)
    const sortedCountRef = useRef(sortedCount)
    sortedCountRef.current = sortedCount

    // Stable refs for the document-level listeners so they never go stale
    const moveRef = useRef<PointerHandler>(null)
    const upRef = useRef<PointerHandler>(null)

    if (!moveRef.current) {
        moveRef.current = (e: PointerEvent) => {
            const dy = Math.abs(e.clientY - startYRef.current)
            if (!isDraggingRef.current && dy < DRAG_THRESHOLD_PX) return
            isDraggingRef.current = true

            // Determine which gap the pointer is closest to
            const rects = rowRectsRef.current
            let dropIdx = rects.length
            for (let i = 0; i < rects.length; i++) {
                const midY = rects[i].top + rects[i].height / 2
                if (e.clientY < midY) {
                    dropIdx = i
                    break
                }
            }

            dropIndexRef.current = dropIdx
            setDragState({ draggedId: draggedIdRef.current, dropIndex: dropIdx })
        }
    }

    if (!upRef.current) {
        upRef.current = (_e: PointerEvent) => {
            document.removeEventListener('pointermove', moveRef.current!)
            document.removeEventListener('pointerup', upRef.current!)

            if (isDraggingRef.current && draggedIdRef.current != null && dropIndexRef.current != null) {
                const count = sortedCountRef.current
                // Visual index 0 = front (highest zIndex), visual index N = back (lowest zIndex).
                // Store's reorderComponentZ works on ascending zIndex order (index 0 = back).
                const rawAscendingIndex = count - dropIndexRef.current
                const ascendingIndex = Math.max(0, Math.min(count - 1, rawAscendingIndex))
                useCanvasStore.getState().reorderComponentZ(draggedIdRef.current, ascendingIndex)
            }

            isDraggingRef.current = false
            draggedIdRef.current = null
            dropIndexRef.current = null
            setDragState(IDLE_DRAG_STATE)
        }
    }

    const onPointerDown = useCallback((componentId: ComponentId, e: React.PointerEvent) => {
        if (e.button !== 0) return
        e.preventDefault()

        startYRef.current = e.clientY
        isDraggingRef.current = false
        draggedIdRef.current = componentId
        dropIndexRef.current = null

        // Snapshot all row rects at drag start
        if (containerRef.current) {
            const rows = containerRef.current.querySelectorAll('[data-layer-row]')
            rowRectsRef.current = Array.from(rows).map((el) => el.getBoundingClientRect())
        }

        document.addEventListener('pointermove', moveRef.current!)
        document.addEventListener('pointerup', upRef.current!)
    }, [])

    return {
        draggedId: dragState.draggedId,
        dropIndex: dragState.dropIndex,
        onPointerDown,
        containerRef,
    }
}
