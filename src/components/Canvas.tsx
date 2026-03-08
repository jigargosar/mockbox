import { useCallback, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCanvasStore, selectCurrentPage, selectCurrentPageHotspots } from '../store/canvas-store'
import { useCanvasInteractions } from '../hooks/use-canvas-interactions'
import { renderSketchyComponent } from '../renderers/sketchy'
import { renderCleanComponent } from '../renderers/clean'
import { snapToGrid } from '../utils/alignment'
import { PALETTE_ENTRIES } from '../types/palette-registry'
import type { Bounds, ComponentId, Hotspot, HotspotId, PageId, Point, WireframeComponent } from '../types/component'

export function Canvas() {
    const svgRef = useRef<SVGSVGElement>(null)
    const componentsLayerRef = useRef<SVGGElement>(null)

    const page = useCanvasStore(selectCurrentPage)
    const selectedIds = useCanvasStore((s) => s.selectedIds)
    const panX = useCanvasStore((s) => s.panX)
    const panY = useCanvasStore((s) => s.panY)
    const zoom = useCanvasStore((s) => s.zoom)
    const gridSize = useCanvasStore((s) => s.gridSize)
    const renderMode = useCanvasStore((s) => s.renderMode)
    const showRulers = useCanvasStore((s) => s.showRulers)
    const draggingKind = useCanvasStore((s) => s.draggingKind)
    const addComponent = useCanvasStore((s) => s.addComponent)
    const setDraggingKind = useCanvasStore((s) => s.setDraggingKind)
    const hotspotMode = useCanvasStore((s) => s.hotspotMode)
    const hotspots = useCanvasStore(useShallow(selectCurrentPageHotspots))
    const selectedHotspotId = useCanvasStore((s) => s.selectedHotspotId)
    const pages = useCanvasStore((s) => s.project.pages)
    const currentPageId = useCanvasStore((s) => s.currentPageId)

    const [hotspotDrawStart, setHotspotDrawStart] = useState<Point | null>(null)
    const [hotspotDrawEnd, setHotspotDrawEnd] = useState<Point | null>(null)
    const [pendingHotspotBounds, setPendingHotspotBounds] = useState<Bounds | null>(null)
    const [hoveredComponentId, setHoveredComponentId] = useState<ComponentId | null>(null)
    const [previewPosition, setPreviewPosition] = useState<Point | null>(null)
    const [contextMenu, setContextMenu] = useState<{ screenX: number; screenY: number; componentId: ComponentId | null } | null>(null)

    const { mode, spaceHeld, marqueeRect, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, screenToCanvas } =
        useCanvasInteractions(svgRef)

    // Render components via imperative roughjs
    useEffect(() => {
        const layer = componentsLayerRef.current
        const svg = svgRef.current
        if (!layer || !svg) return

        // Clear
        while (layer.firstChild) layer.removeChild(layer.firstChild)

        const sorted = [...page.components].sort((a, b) => a.zIndex - b.zIndex)

        for (const component of sorted) {
            if (!component.visible) continue
            const g = renderMode === 'sketchy' ? renderSketchyComponent(svg, component) : renderCleanComponent(component)

            // Insert invisible hit area covering full bounds so the entire
            // component area is clickable, not just the thin roughjs strokes
            const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            hitArea.setAttribute('x', String(component.bounds.x))
            hitArea.setAttribute('y', String(component.bounds.y))
            hitArea.setAttribute('width', String(component.bounds.width))
            hitArea.setAttribute('height', String(component.bounds.height))
            hitArea.setAttribute('fill', 'transparent')
            hitArea.setAttribute('stroke', 'none')
            g.insertBefore(hitArea, g.firstChild)

            g.dataset.componentId = component.id
            layer.appendChild(g)
        }
    }, [page.components, renderMode])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            const kind = e.dataTransfer.getData('component-kind')
            if (!kind) return
            const point = screenToCanvas(e.clientX, e.clientY)
            const gs = useCanvasStore.getState().gridSize
            addComponent(kind as WireframeComponent['kind'], snapToGrid(point.x, gs), snapToGrid(point.y, gs))
            setDraggingKind(null)
        },
        [screenToCanvas, addComponent, setDraggingKind],
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    }, [])

    const hotspotDrawRect = hotspotDrawStart && hotspotDrawEnd
        ? {
              x: Math.min(hotspotDrawStart.x, hotspotDrawEnd.x),
              y: Math.min(hotspotDrawStart.y, hotspotDrawEnd.y),
              width: Math.abs(hotspotDrawEnd.x - hotspotDrawStart.x),
              height: Math.abs(hotspotDrawEnd.y - hotspotDrawStart.y),
          }
        : null

    function handleCanvasMouseDown(e: React.MouseEvent<SVGSVGElement>) {
        // Dismiss context menu on any click
        if (contextMenu) {
            setContextMenu(null)
        }

        if (hotspotMode && e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey) {
            // Check if clicking on existing hotspot
            const target = e.target as SVGElement
            const hotspotGroup = target.closest('[data-hotspot-id]') as SVGElement | null
            if (hotspotGroup) {
                const hotspotId = hotspotGroup.dataset.hotspotId as HotspotId
                useCanvasStore.getState().selectHotspot(hotspotId)
                return
            }
            // Start drawing a new hotspot
            const point = screenToCanvas(e.clientX, e.clientY)
            setHotspotDrawStart(point)
            setHotspotDrawEnd(point)
            return
        }

        const currentDraggingKind = useCanvasStore.getState().draggingKind
        if (currentDraggingKind) {
            const point = screenToCanvas(e.clientX, e.clientY)
            const gs = useCanvasStore.getState().gridSize
            addComponent(currentDraggingKind, snapToGrid(point.x, gs), snapToGrid(point.y, gs))
            setDraggingKind(null)
            setPreviewPosition(null)
            return
        }
        // Detect resize handle click (DOM-based, handles are React-rendered)
        const target = e.target as SVGElement
        const handleEl = target.closest('[data-handle]') as SVGElement | null
        if (handleEl) {
            const handle = handleEl.dataset.handle as 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | undefined
            const compId = handleEl.dataset.componentId as ComponentId | undefined
            if (handle && compId) {
                handleMouseDown(e, compId, handle)
                return
            }
        }

        // Bounds-based hit testing: click anywhere inside a component's
        // bounding box to select/drag, not just on its thin visual strokes
        const point = screenToCanvas(e.clientX, e.clientY)
        const componentId = findTopmostComponentAt(page.components, point)
        handleMouseDown(e, componentId)
    }

    function handleCanvasMouseMove(e: React.MouseEvent<SVGSVGElement>) {
        if (hotspotMode && hotspotDrawStart) {
            const point = screenToCanvas(e.clientX, e.clientY)
            setHotspotDrawEnd(point)
            return
        }

        // Bounds-based hover tracking
        const point = screenToCanvas(e.clientX, e.clientY)
        const hovered = findTopmostComponentAt(page.components, point)
        setHoveredComponentId(hovered ?? null)

        // Track placement preview position
        if (useCanvasStore.getState().draggingKind) {
            const point = screenToCanvas(e.clientX, e.clientY)
            const gs = useCanvasStore.getState().gridSize
            setPreviewPosition({ x: snapToGrid(point.x, gs), y: snapToGrid(point.y, gs) })
        } else if (previewPosition) {
            setPreviewPosition(null)
        }

        handleMouseMove(e)
    }

    function handleCanvasMouseUp() {
        if (hotspotMode && hotspotDrawStart && hotspotDrawEnd) {
            const bounds: Bounds = {
                x: Math.min(hotspotDrawStart.x, hotspotDrawEnd.x),
                y: Math.min(hotspotDrawStart.y, hotspotDrawEnd.y),
                width: Math.abs(hotspotDrawEnd.x - hotspotDrawStart.x),
                height: Math.abs(hotspotDrawEnd.y - hotspotDrawStart.y),
            }
            setHotspotDrawStart(null)
            setHotspotDrawEnd(null)
            // Only create if the drawn area is large enough
            if (bounds.width > 10 && bounds.height > 10) {
                setPendingHotspotBounds(bounds)
            }
            return
        }
        handleMouseUp()
    }

    function handleContextMenu(e: React.MouseEvent) {
        e.preventDefault()
        const target = e.target as SVGElement
        const componentGroup = target.closest('[data-component-id]') as SVGElement | null
        const componentId = componentGroup?.dataset.componentId as ComponentId | undefined

        if (componentId && !selectedIds.includes(componentId)) {
            useCanvasStore.getState().select(componentId, false)
        }

        setContextMenu({
            screenX: e.clientX,
            screenY: e.clientY,
            componentId: componentId ?? null,
        })
    }

    function handleTargetPageSelected(targetPageId: PageId) {
        if (!pendingHotspotBounds) return
        useCanvasStore.getState().addHotspot(currentPageId, targetPageId, pendingHotspotBounds)
        setPendingHotspotBounds(null)
    }

    function handleTargetPickerCancel() {
        setPendingHotspotBounds(null)
    }

    // Compute cursor based on interaction state
    const cursorClass = computeCursor(mode, spaceHeld, draggingKind !== null, hotspotMode)

    const rulerOffset = showRulers ? 24 : 0
    const scaledGrid = gridSize * zoom

    // Get default size for placement preview
    const previewEntry = draggingKind ? PALETTE_ENTRIES.find((e) => e.kind === draggingKind) : null

    // Multi-select bounding box
    const multiSelectBounds = selectedIds.length > 1 ? computeMultiSelectBounds(page.components, selectedIds) : null

    // Group bounding boxes for selected groups
    const selectedGroupBounds = computeSelectedGroupBounds(page.components, selectedIds)

    return (
        <div className="absolute inset-0 overflow-hidden bg-white">
            {/* Rulers */}
            {showRulers && (
                <>
                    <HorizontalRuler panX={panX} zoom={zoom} offset={rulerOffset} />
                    <VerticalRuler panY={panY} zoom={zoom} offset={rulerOffset} />
                    <div className="absolute top-0 left-0 z-20 h-6 w-6 bg-gray-200 border-b border-r border-gray-300" />
                </>
            )}

            <svg
                ref={svgRef}
                className={`absolute inset-0 ${cursorClass}`}
                style={{ top: rulerOffset, left: rulerOffset, width: `calc(100% - ${rulerOffset}px)`, height: `calc(100% - ${rulerOffset}px)` }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={() => { setHoveredComponentId(null); setPreviewPosition(null) }}
                onWheel={handleWheel}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onContextMenu={handleContextMenu}
            >
                {/* Grid */}
                <defs>
                    <pattern id="grid" width={scaledGrid} height={scaledGrid} patternUnits="userSpaceOnUse" x={panX % scaledGrid} y={panY % scaledGrid}>
                        <circle cx={scaledGrid / 2} cy={scaledGrid / 2} r={0.5} fill="#ccc" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Canvas transform group */}
                <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
                    <g ref={componentsLayerRef} />

                    {/* Hover outline (only for non-selected components) */}
                    {hoveredComponentId && !selectedIds.includes(hoveredComponentId) && mode === 'idle' && (() => {
                        const hovered = page.components.find((c) => c.id === hoveredComponentId)
                        return hovered ? <HoverOutline component={hovered} /> : null
                    })()}

                    {/* Selection outlines */}
                    {selectedIds.map((id) => {
                        const component = page.components.find((c) => c.id === id)
                        if (!component) return null
                        return <SelectionOutline key={id} component={component} />
                    })}

                    {/* Multi-select bounding box */}
                    {multiSelectBounds && (
                        <rect
                            x={multiSelectBounds.x}
                            y={multiSelectBounds.y}
                            width={multiSelectBounds.width}
                            height={multiSelectBounds.height}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth={0.5}
                            strokeDasharray="8 4"
                            opacity={0.5}
                        />
                    )}

                    {/* Group bounding boxes */}
                    {selectedGroupBounds.map((gb) => (
                        <rect
                            key={gb.groupId}
                            x={gb.bounds.x - 4}
                            y={gb.bounds.y - 4}
                            width={gb.bounds.width + 8}
                            height={gb.bounds.height + 8}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth={1.5}
                            strokeDasharray="6 3"
                            rx={4}
                            pointerEvents="none"
                        />
                    ))}

                    {/* Locked component indicators */}
                    {page.components.filter((c) => c.locked && c.visible).map((c) => (
                        <LockedIndicator key={`lock-${c.id}`} component={c} />
                    ))}

                    {/* Placement preview ghost */}
                    {previewEntry && previewPosition && (
                        <rect
                            x={previewPosition.x}
                            y={previewPosition.y}
                            width={previewEntry.defaultSize.width}
                            height={previewEntry.defaultSize.height}
                            fill="rgba(59, 130, 246, 0.06)"
                            stroke="#3b82f6"
                            strokeWidth={1}
                            strokeDasharray="4 3"
                            opacity={0.5}
                            rx={3}
                        />
                    )}

                    {/* Hotspot overlays */}
                    {hotspots.map((hotspot) => (
                        <HotspotOverlay
                            key={hotspot.id}
                            hotspot={hotspot}
                            selected={hotspot.id === selectedHotspotId}
                            pages={pages}
                        />
                    ))}

                    {/* Hotspot drawing preview */}
                    {hotspotDrawRect && (
                        <rect
                            x={hotspotDrawRect.x}
                            y={hotspotDrawRect.y}
                            width={hotspotDrawRect.width}
                            height={hotspotDrawRect.height}
                            fill="rgba(59, 130, 246, 0.15)"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="6 3"
                            rx={3}
                        />
                    )}
                </g>

                {/* Marquee */}
                {marqueeRect && (
                    <rect
                        x={marqueeRect.x * zoom + panX}
                        y={marqueeRect.y * zoom + panY}
                        width={marqueeRect.width * zoom}
                        height={marqueeRect.height * zoom}
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="#3b82f6"
                        strokeWidth={1}
                        strokeDasharray="4 2"
                    />
                )}
            </svg>

            {/* Drop indicator */}
            {draggingKind && (
                <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50/20" style={{ top: rulerOffset, left: rulerOffset }} />
            )}

            {/* Hotspot mode indicator */}
            {hotspotMode && (
                <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded bg-blue-500 px-3 py-1 text-xs text-white shadow" style={{ marginTop: rulerOffset }}>
                    Hotspot mode: draw a region, then pick a target page
                </div>
            )}

            {/* Target page picker dropdown */}
            {pendingHotspotBounds && (
                <TargetPagePicker
                    bounds={pendingHotspotBounds}
                    panX={panX}
                    panY={panY}
                    zoom={zoom}
                    rulerOffset={rulerOffset}
                    pages={pages}
                    currentPageId={currentPageId}
                    onSelect={handleTargetPageSelected}
                    onCancel={handleTargetPickerCancel}
                />
            )}

            {/* Context menu */}
            {contextMenu && (
                <CanvasContextMenu
                    screenX={contextMenu.screenX}
                    screenY={contextMenu.screenY}
                    hasComponent={contextMenu.componentId !== null}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    )
}

type InteractionMode = 'idle' | 'panning' | 'dragging' | 'marquee' | 'resizing'

function computeCursor(mode: InteractionMode, spaceHeld: boolean, hasDraggingKind: boolean, hotspotMode: boolean): string {
    if (mode === 'panning') return 'cursor-grabbing'
    if (mode === 'dragging') return 'cursor-grabbing'
    if (mode === 'marquee') return 'cursor-crosshair'
    if (spaceHeld) return 'cursor-grab'
    if (hasDraggingKind) return 'cursor-crosshair'
    if (hotspotMode) return 'cursor-crosshair'
    return 'cursor-default'
}

function findTopmostComponentAt(components: readonly WireframeComponent[], point: Point): ComponentId | undefined {
    // Iterate front-to-back (highest z-index first) to find the topmost hit
    const sorted = [...components].sort((a, b) => b.zIndex - a.zIndex)
    for (const c of sorted) {
        if (!c.visible) continue
        if (
            point.x >= c.bounds.x &&
            point.x <= c.bounds.x + c.bounds.width &&
            point.y >= c.bounds.y &&
            point.y <= c.bounds.y + c.bounds.height
        ) {
            return c.id
        }
    }
    return undefined
}

function computeSelectedGroupBounds(
    components: readonly WireframeComponent[],
    selectedIds: readonly ComponentId[],
): { groupId: ComponentId; bounds: Bounds }[] {
    const groupIds = new Set<ComponentId>()
    for (const c of components) {
        if (c.groupId && selectedIds.includes(c.id)) groupIds.add(c.groupId)
    }
    const result: { groupId: ComponentId; bounds: Bounds }[] = []
    for (const groupId of groupIds) {
        const members = components.filter((c) => c.groupId === groupId)
        if (members.length < 2) continue
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const c of members) {
            minX = Math.min(minX, c.bounds.x)
            minY = Math.min(minY, c.bounds.y)
            maxX = Math.max(maxX, c.bounds.x + c.bounds.width)
            maxY = Math.max(maxY, c.bounds.y + c.bounds.height)
        }
        result.push({ groupId, bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } })
    }
    return result
}

function computeMultiSelectBounds(components: readonly WireframeComponent[], ids: readonly ComponentId[]): Bounds | null {
    const selected = components.filter((c) => ids.includes(c.id))
    if (selected.length < 2) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const c of selected) {
        minX = Math.min(minX, c.bounds.x)
        minY = Math.min(minY, c.bounds.y)
        maxX = Math.max(maxX, c.bounds.x + c.bounds.width)
        maxY = Math.max(maxY, c.bounds.y + c.bounds.height)
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function HoverOutline({ component }: { component: WireframeComponent }) {
    const { x, y, width, height } = component.bounds
    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="none"
            stroke="#93c5fd"
            strokeWidth={1}
            rx={2}
            pointerEvents="none"
        />
    )
}

function LockedIndicator({ component }: { component: WireframeComponent }) {
    const { x, y, width } = component.bounds
    return (
        <g pointerEvents="none" opacity={0.5}>
            <rect x={x + width - 16} y={y + 2} width={14} height={14} rx={2} fill="white" stroke="#94a3b8" strokeWidth={0.5} />
            <text x={x + width - 12} y={y + 13} fontSize={10} fill="#64748b">&#x1F512;</text>
        </g>
    )
}

function SelectionOutline({ component }: { component: WireframeComponent }) {
    const { x, y, width, height } = component.bounds
    const handleSize = 8

    const handles = [
        { cursor: 'nw-resize', handle: 'nw' as const, cx: x, cy: y },
        { cursor: 'ne-resize', handle: 'ne' as const, cx: x + width, cy: y },
        { cursor: 'sw-resize', handle: 'sw' as const, cx: x, cy: y + height },
        { cursor: 'se-resize', handle: 'se' as const, cx: x + width, cy: y + height },
        { cursor: 'n-resize', handle: 'n' as const, cx: x + width / 2, cy: y },
        { cursor: 's-resize', handle: 's' as const, cx: x + width / 2, cy: y + height },
        { cursor: 'w-resize', handle: 'w' as const, cx: x, cy: y + height / 2 },
        { cursor: 'e-resize', handle: 'e' as const, cx: x + width, cy: y + height / 2 },
    ]

    const hitSize = 20

    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" />
            {handles.map((h) => (
                <g key={h.handle}>
                    {/* Invisible expanded hit area for easier grabbing */}
                    <rect
                        x={h.cx - hitSize / 2}
                        y={h.cy - hitSize / 2}
                        width={hitSize}
                        height={hitSize}
                        fill="transparent"
                        style={{ cursor: h.cursor }}
                        data-component-id={component.id}
                        data-handle={h.handle}
                    />
                    {/* Visible handle */}
                    <rect
                        x={h.cx - handleSize / 2}
                        y={h.cy - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        style={{ cursor: h.cursor }}
                        pointerEvents="none"
                    />
                </g>
            ))}
        </g>
    )
}

function HotspotOverlay({ hotspot, selected, pages }: { hotspot: Hotspot; selected: boolean; pages: readonly { readonly id: PageId; readonly name: string }[] }) {
    const { x, y, width, height } = hotspot.bounds
    const targetPage = pages.find((p) => p.id === hotspot.targetPageId)
    const targetName = targetPage?.name ?? 'Unknown'

    return (
        <g data-hotspot-id={hotspot.id} style={{ cursor: 'pointer' }}>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="rgba(59, 130, 246, 0.12)"
                stroke={selected ? '#2563eb' : '#3b82f6'}
                strokeWidth={selected ? 2.5 : 1.5}
                strokeDasharray="6 3"
                rx={3}
            />
            <text
                x={x + 4}
                y={y + 14}
                fontSize={11}
                fontFamily="'Caveat', 'Comic Neue', cursive"
                fill="#2563eb"
            >
                {targetName}
            </text>
        </g>
    )
}

type TargetPagePickerProps = {
    bounds: Bounds
    panX: number
    panY: number
    zoom: number
    rulerOffset: number
    pages: readonly { readonly id: PageId; readonly name: string }[]
    currentPageId: PageId
    onSelect: (pageId: PageId) => void
    onCancel: () => void
}

function TargetPagePicker({ bounds, panX, panY, zoom, rulerOffset, pages, currentPageId, onSelect, onCancel }: TargetPagePickerProps) {
    const pickerRef = useRef<HTMLDivElement>(null)
    const screenX = bounds.x * zoom + panX + rulerOffset
    const screenY = (bounds.y + bounds.height) * zoom + panY + rulerOffset + 4

    const otherPages = pages.filter((p) => p.id !== currentPageId)

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onCancel()
            }
        }
        window.addEventListener('mousedown', handleClick)
        return () => window.removeEventListener('mousedown', handleClick)
    }, [onCancel])

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onCancel()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onCancel])

    if (otherPages.length === 0) {
        return (
            <div
                ref={pickerRef}
                className="absolute z-40 rounded border border-gray-300 bg-white p-3 text-xs text-gray-500 shadow-lg"
                style={{ left: screenX, top: screenY }}
            >
                No other pages to link to.
                <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={onCancel}>
                    Close
                </button>
            </div>
        )
    }

    return (
        <div
            ref={pickerRef}
            className="absolute z-40 rounded border border-gray-300 bg-white shadow-lg"
            style={{ left: screenX, top: screenY, minWidth: 140 }}
        >
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-100">
                Link to page
            </div>
            {otherPages.map((p) => (
                <button
                    key={p.id}
                    className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => onSelect(p.id)}
                >
                    {p.name}
                </button>
            ))}
        </div>
    )
}

function CanvasContextMenu({ screenX, screenY, hasComponent, onClose }: { screenX: number; screenY: number; hasComponent: boolean; onClose: () => void }) {
    const menuRef = useRef<HTMLDivElement>(null)
    const store = useCanvasStore
    const clipboardLength = store((s) => s.clipboard.length)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('mousedown', handleClick)
        window.addEventListener('keydown', handleKey)
        return () => {
            window.removeEventListener('mousedown', handleClick)
            window.removeEventListener('keydown', handleKey)
        }
    }, [onClose])

    function action(fn: () => void) {
        fn()
        onClose()
    }

    return (
        <div
            ref={menuRef}
            className="absolute z-50 min-w-[160px] rounded border border-gray-200 bg-white py-1 shadow-lg"
            style={{ left: screenX, top: screenY }}
        >
            {hasComponent && (
                <>
                    <ContextMenuItem label="Cut" shortcut="Ctrl+X" onClick={() => action(() => store.getState().cutSelected())} />
                    <ContextMenuItem label="Copy" shortcut="Ctrl+C" onClick={() => action(() => store.getState().copySelected())} />
                    <ContextMenuItem label="Duplicate" shortcut="Ctrl+D" onClick={() => action(() => store.getState().duplicateSelected())} />
                    <ContextMenuItem label="Delete" shortcut="Del" onClick={() => action(() => store.getState().deleteSelected())} />
                    <div className="my-1 border-t border-gray-100" />
                    <ContextMenuItem label="Bring to Front" shortcut="Ctrl+Shift+]" onClick={() => action(() => store.getState().bringToFront())} />
                    <ContextMenuItem label="Send to Back" shortcut="Ctrl+Shift+[" onClick={() => action(() => store.getState().sendToBack())} />
                    <ContextMenuItem label="Move Up" shortcut="Ctrl+]" onClick={() => action(() => store.getState().moveUp())} />
                    <ContextMenuItem label="Move Down" shortcut="Ctrl+[" onClick={() => action(() => store.getState().moveDown())} />
                    <div className="my-1 border-t border-gray-100" />
                </>
            )}
            <ContextMenuItem
                label="Paste"
                shortcut="Ctrl+V"
                onClick={() => action(() => store.getState().pasteClipboard())}
                disabled={clipboardLength === 0}
            />
            <ContextMenuItem label="Select All" shortcut="Ctrl+A" onClick={() => action(() => store.getState().selectAll())} />
        </div>
    )
}

function ContextMenuItem({ label, shortcut, onClick, disabled = false }: { label: string; shortcut: string; onClick: () => void; disabled?: boolean }) {
    return (
        <button
            className={`flex w-full items-center justify-between px-3 py-1.5 text-xs ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            <span>{label}</span>
            <span className="ml-4 text-[10px] text-gray-400">{shortcut}</span>
        </button>
    )
}

function HorizontalRuler({ panX, zoom, offset }: { panX: number; zoom: number; offset: number }) {
    const marks: { x: number; label: string }[] = []
    const step = 50
    for (let i = -5000; i < 5000; i += step) {
        const screenX = i * zoom + panX + offset
        if (screenX > offset - 10 && screenX < 3000) {
            marks.push({ x: screenX, label: String(i) })
        }
    }
    return (
        <div className="absolute top-0 left-6 right-0 z-10 h-6 overflow-hidden bg-gray-100 border-b border-gray-300">
            <svg width="100%" height="24">
                {marks.map((m) => (
                    <g key={m.label + m.x}>
                        <line x1={m.x - offset} y1={16} x2={m.x - offset} y2={24} stroke="#999" strokeWidth={0.5} />
                        <text x={m.x - offset + 2} y={12} fontSize={9} fill="#666">
                            {m.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    )
}

function VerticalRuler({ panY, zoom, offset }: { panY: number; zoom: number; offset: number }) {
    const marks: { y: number; label: string }[] = []
    const step = 50
    for (let i = -5000; i < 5000; i += step) {
        const screenY = i * zoom + panY + offset
        if (screenY > offset - 10 && screenY < 3000) {
            marks.push({ y: screenY, label: String(i) })
        }
    }
    return (
        <div className="absolute top-6 left-0 bottom-0 z-10 w-6 overflow-hidden bg-gray-100 border-r border-gray-300">
            <svg width="24" height="100%">
                {marks.map((m) => (
                    <g key={m.label + m.y}>
                        <line x1={16} y1={m.y - offset} x2={24} y2={m.y - offset} stroke="#999" strokeWidth={0.5} />
                        <text x={2} y={m.y - offset - 2} fontSize={9} fill="#666" transform={`rotate(-90, 2, ${m.y - offset - 2})`}>
                            {m.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    )
}
