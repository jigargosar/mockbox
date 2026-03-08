import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCanvasStore, selectCurrentPage, selectCurrentPageHotspots } from '../store/canvas-store'
import { renderSketchyComponent } from '../renderers/sketchy'
import { renderCleanComponent } from '../renderers/clean'
import type { Hotspot, PageId } from '../types/component'

export function PresentationMode() {
    const presentationMode = useCanvasStore((s) => s.presentationMode)
    const page = useCanvasStore(selectCurrentPage)
    const renderMode = useCanvasStore((s) => s.renderMode)
    const togglePresentation = useCanvasStore((s) => s.togglePresentation)
    const pages = useCanvasStore((s) => s.project.pages)
    const setCurrentPage = useCanvasStore((s) => s.setCurrentPage)
    const currentPageId = useCanvasStore((s) => s.currentPageId)
    const hotspots = useCanvasStore(useShallow(selectCurrentPageHotspots))
    const svgRef = useRef<SVGSVGElement>(null)
    const layerRef = useRef<SVGGElement>(null)

    useEffect(() => {
        if (!presentationMode) return
        const layer = layerRef.current
        const svg = svgRef.current
        if (!layer || !svg) return

        while (layer.firstChild) layer.removeChild(layer.firstChild)

        const sorted = [...page.components].sort((a, b) => a.zIndex - b.zIndex)
        for (const component of sorted) {
            if (!component.visible) continue
            const g = renderMode === 'sketchy' ? renderSketchyComponent(svg, component) : renderCleanComponent(component)
            layer.appendChild(g)
        }
    }, [presentationMode, page.components, renderMode])

    // Keyboard navigation
    useEffect(() => {
        if (!presentationMode) return
        function handleKey(e: KeyboardEvent) {
            const currentIndex = pages.findIndex((p) => p.id === currentPageId)
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                if (currentIndex < pages.length - 1) setCurrentPage(pages[currentIndex + 1].id)
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                if (currentIndex > 0) setCurrentPage(pages[currentIndex - 1].id)
            } else if (e.key === 'Escape') {
                togglePresentation()
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [presentationMode, pages, currentPageId, setCurrentPage, togglePresentation])

    if (!presentationMode) return null

    const currentIndex = pages.findIndex((p) => p.id === currentPageId)

    function goNext() {
        if (currentIndex < pages.length - 1) {
            setCurrentPage(pages[currentIndex + 1].id)
        }
    }

    function goPrev() {
        if (currentIndex > 0) {
            setCurrentPage(pages[currentIndex - 1].id)
        }
    }

    function handleHotspotClick(hotspot: Hotspot) {
        const targetExists = pages.some((p) => p.id === hotspot.targetPageId)
        if (targetExists) {
            setCurrentPage(hotspot.targetPageId)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
                <span className="text-sm text-white">{page.name}</span>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                        {currentIndex + 1} / {pages.length}
                    </span>
                    <button className="text-xs text-gray-400 hover:text-white disabled:opacity-30" onClick={goPrev} disabled={currentIndex === 0}>
                        ← Prev
                    </button>
                    <button className="text-xs text-gray-400 hover:text-white disabled:opacity-30" onClick={goNext} disabled={currentIndex === pages.length - 1}>
                        Next →
                    </button>
                    <button className="text-xs text-gray-400 hover:text-white" onClick={togglePresentation}>
                        ✕ Close
                    </button>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-8">
                <svg ref={svgRef} width="100%" height="100%" className="max-w-full max-h-full">
                    <rect width="100%" height="100%" fill="white" />
                    <g ref={layerRef} />

                    {/* Clickable hotspot regions */}
                    {hotspots.map((hotspot) => (
                        <PresentationHotspot
                            key={hotspot.id}
                            hotspot={hotspot}
                            pages={pages}
                            onClick={() => handleHotspotClick(hotspot)}
                        />
                    ))}
                </svg>
            </div>
            <div className="px-4 py-1.5 bg-gray-900 text-center">
                <span className="text-[10px] text-gray-500">
                    Arrow keys to navigate
                    {hotspots.length > 0 && ' · Click hotspots to jump to linked pages'}
                </span>
            </div>
        </div>
    )
}

function PresentationHotspot({ hotspot, pages, onClick }: { hotspot: Hotspot; pages: readonly { readonly id: PageId; readonly name: string }[]; onClick: () => void }) {
    const { x, y, width, height } = hotspot.bounds
    const targetPage = pages.find((p) => p.id === hotspot.targetPageId)
    if (!targetPage) return null

    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="transparent"
            stroke="transparent"
            style={{ cursor: 'pointer' }}
            onClick={onClick}
            onMouseEnter={(e) => {
                const rect = e.currentTarget
                rect.setAttribute('fill', 'rgba(59, 130, 246, 0.08)')
                rect.setAttribute('stroke', 'rgba(59, 130, 246, 0.3)')
                rect.setAttribute('stroke-width', '2')
                rect.setAttribute('rx', '3')
            }}
            onMouseLeave={(e) => {
                const rect = e.currentTarget
                rect.setAttribute('fill', 'transparent')
                rect.setAttribute('stroke', 'transparent')
            }}
        />
    )
}
