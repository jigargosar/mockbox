import { useEffect, useRef } from 'react'
import { useCanvasStore, selectCurrentPage } from '../store/canvas-store'
import { renderSketchyComponent } from '../renderers/sketchy'
import { renderCleanComponent } from '../renderers/clean'

export function PresentationMode() {
    const presentationMode = useCanvasStore((s) => s.presentationMode)
    const page = useCanvasStore(selectCurrentPage)
    const renderMode = useCanvasStore((s) => s.renderMode)
    const togglePresentation = useCanvasStore((s) => s.togglePresentation)
    const pages = useCanvasStore((s) => s.project.pages)
    const setCurrentPage = useCanvasStore((s) => s.setCurrentPage)
    const currentPageId = useCanvasStore((s) => s.currentPageId)
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

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
                <span className="text-sm text-white">{page.name}</span>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                        {currentIndex + 1} / {pages.length}
                    </span>
                    <button className="text-xs text-gray-400 hover:text-white" onClick={goPrev} disabled={currentIndex === 0}>
                        ← Prev
                    </button>
                    <button className="text-xs text-gray-400 hover:text-white" onClick={goNext} disabled={currentIndex === pages.length - 1}>
                        Next →
                    </button>
                    <button className="text-xs text-gray-400 hover:text-white" onClick={togglePresentation}>
                        ✕ Close
                    </button>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <svg ref={svgRef} width="100%" height="100%" className="max-w-full max-h-full">
                    <rect width="100%" height="100%" fill="white" />
                    <g ref={layerRef} />
                </svg>
            </div>
        </div>
    )
}
