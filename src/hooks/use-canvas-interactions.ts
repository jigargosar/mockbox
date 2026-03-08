import { useCallback, useEffect, useRef, useState } from 'react'
import { useCanvasStore, selectCurrentPage } from '../store/canvas-store'
import { snapToGrid } from '../utils/alignment'
import type { ComponentId, Point } from '../types/component'

type InteractionMode = 'idle' | 'panning' | 'dragging' | 'marquee' | 'resizing'

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export function useCanvasInteractions(svgRef: React.RefObject<SVGSVGElement | null>) {
    const [mode, setMode] = useState<InteractionMode>('idle')
    const [marqueeStart, setMarqueeStart] = useState<Point | null>(null)
    const [marqueeEnd, setMarqueeEnd] = useState<Point | null>(null)
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)
    const [spaceHeld, setSpaceHeld] = useState(false)
    const dragStartRef = useRef<Point | null>(null)
    const dragComponentRef = useRef<ComponentId | null>(null)
    const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
    const resizeStartRef = useRef<{ x: number; y: number; bounds: { x: number; y: number; width: number; height: number } } | null>(null)
    const spaceHeldRef = useRef(false)

    // Space key tracking for pan
    useEffect(() => {
        const onDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'INPUT') {
                e.preventDefault()
                spaceHeldRef.current = true
                setSpaceHeld(true)
            }
        }
        const onUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                spaceHeldRef.current = false
                setSpaceHeld(false)
            }
        }
        window.addEventListener('keydown', onDown)
        window.addEventListener('keyup', onUp)
        return () => {
            window.removeEventListener('keydown', onDown)
            window.removeEventListener('keyup', onUp)
        }
    }, [])

    const store = useCanvasStore

    const screenToCanvas = useCallback(
        (clientX: number, clientY: number): Point => {
            const svg = svgRef.current
            if (!svg) return { x: clientX, y: clientY }
            const rect = svg.getBoundingClientRect()
            const { panX, panY, zoom } = store.getState()
            return {
                x: (clientX - rect.left - panX) / zoom,
                y: (clientY - rect.top - panY) / zoom,
            }
        },
        [svgRef],
    )

    const handleMouseDown = useCallback(
        (e: React.MouseEvent, componentId?: ComponentId, handle?: ResizeHandle) => {
            if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && spaceHeldRef.current)) {
                // Middle click, alt+click, or space+click → pan
                setMode('panning')
                const { panX, panY } = store.getState()
                panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY }
                return
            }

            if (handle && componentId) {
                setMode('resizing')
                setResizeHandle(handle)
                const component = selectCurrentPage(store.getState()).components.find((c) => c.id === componentId)
                if (component) {
                    resizeStartRef.current = { x: e.clientX, y: e.clientY, bounds: { ...component.bounds } }
                    dragComponentRef.current = componentId
                }
                return
            }

            if (componentId) {
                const component = selectCurrentPage(store.getState()).components.find((c) => c.id === componentId)
                if (component?.locked) return

                store.getState().select(componentId, e.shiftKey)
                setMode('dragging')
                const point = screenToCanvas(e.clientX, e.clientY)
                dragStartRef.current = point
                dragComponentRef.current = componentId
                return
            }

            // Click on empty canvas → start marquee
            if (!e.shiftKey) {
                store.getState().clearSelection()
            }
            setMode('marquee')
            const point = screenToCanvas(e.clientX, e.clientY)
            setMarqueeStart(point)
            setMarqueeEnd(point)
        },
        [screenToCanvas],
    )

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (mode === 'panning' && panStartRef.current) {
                const dx = e.clientX - panStartRef.current.x
                const dy = e.clientY - panStartRef.current.y
                store.getState().setPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy)
                return
            }

            if (mode === 'dragging' && dragStartRef.current) {
                const point = screenToCanvas(e.clientX, e.clientY)
                const rawDx = point.x - dragStartRef.current.x
                const rawDy = point.y - dragStartRef.current.y
                const { gridSize } = store.getState()
                const dx = snapToGrid(rawDx, gridSize)
                const dy = snapToGrid(rawDy, gridSize)
                if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                    store.getState().moveSelected(dx, dy)
                    dragStartRef.current = { x: dragStartRef.current.x + dx, y: dragStartRef.current.y + dy }
                }
                return
            }

            if (mode === 'marquee' && marqueeStart) {
                const point = screenToCanvas(e.clientX, e.clientY)
                setMarqueeEnd(point)
                return
            }

            if (mode === 'resizing' && resizeStartRef.current && resizeHandle && dragComponentRef.current) {
                const dx = (e.clientX - resizeStartRef.current.x) / store.getState().zoom
                const dy = (e.clientY - resizeStartRef.current.y) / store.getState().zoom
                const orig = resizeStartRef.current.bounds
                let { x, y, width, height } = orig
                const aspectRatio = orig.width / orig.height

                if (resizeHandle.includes('e')) width = Math.max(20, orig.width + dx)
                if (resizeHandle.includes('w')) {
                    width = Math.max(20, orig.width - dx)
                    x = orig.x + orig.width - width
                }
                if (resizeHandle.includes('s')) height = Math.max(20, orig.height + dy)
                if (resizeHandle.includes('n')) {
                    height = Math.max(20, orig.height - dy)
                    y = orig.y + orig.height - height
                }

                // Aspect ratio lock with shift
                if (e.shiftKey) {
                    if (resizeHandle === 'e' || resizeHandle === 'w') {
                        height = width / aspectRatio
                    } else if (resizeHandle === 'n' || resizeHandle === 's') {
                        width = height * aspectRatio
                    } else {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            height = width / aspectRatio
                        } else {
                            width = height * aspectRatio
                        }
                    }
                    if (resizeHandle.includes('n')) y = orig.y + orig.height - height
                    if (resizeHandle.includes('w')) x = orig.x + orig.width - width
                }

                store.getState().resizeComponent(dragComponentRef.current, { x, y, width, height })
                return
            }
        },
        [mode, marqueeStart, screenToCanvas, resizeHandle],
    )

    const handleMouseUp = useCallback(() => {
        if (mode === 'marquee' && marqueeStart && marqueeEnd) {
            const x = Math.min(marqueeStart.x, marqueeEnd.x)
            const y = Math.min(marqueeStart.y, marqueeEnd.y)
            const width = Math.abs(marqueeEnd.x - marqueeStart.x)
            const height = Math.abs(marqueeEnd.y - marqueeStart.y)
            if (width > 5 || height > 5) {
                store.getState().marqueeSelect({ x, y, width, height })
            }
        }

        setMode('idle')
        setMarqueeStart(null)
        setMarqueeEnd(null)
        setResizeHandle(null)
        dragStartRef.current = null
        dragComponentRef.current = null
        panStartRef.current = null
        resizeStartRef.current = null
    }, [mode, marqueeStart, marqueeEnd])

    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault()
                const delta = e.deltaY > 0 ? 0.9 : 1.1
                store.getState().setZoom(store.getState().zoom * delta)
            } else {
                const { panX, panY } = store.getState()
                store.getState().setPan(panX - e.deltaX, panY - e.deltaY)
            }
        },
        [],
    )

    const marqueeRect =
        marqueeStart && marqueeEnd
            ? {
                  x: Math.min(marqueeStart.x, marqueeEnd.x),
                  y: Math.min(marqueeStart.y, marqueeEnd.y),
                  width: Math.abs(marqueeEnd.x - marqueeStart.x),
                  height: Math.abs(marqueeEnd.y - marqueeStart.y),
              }
            : null

    return {
        mode,
        spaceHeld,
        marqueeRect,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        screenToCanvas,
    }
}
