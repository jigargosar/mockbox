import { useCanvasStore, selectCurrentPage } from '../store/canvas-store'

const MINIMAP_WIDTH = 180
const MINIMAP_HEIGHT = 120

export function Minimap() {
    const showMinimap = useCanvasStore((s) => s.showMinimap)
    const page = useCanvasStore(selectCurrentPage)
    const panX = useCanvasStore((s) => s.panX)
    const panY = useCanvasStore((s) => s.panY)
    const zoom = useCanvasStore((s) => s.zoom)
    const setPan = useCanvasStore((s) => s.setPan)

    if (!showMinimap || page.components.length === 0) return null

    // Compute bounding box of all components
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const c of page.components) {
        minX = Math.min(minX, c.bounds.x)
        minY = Math.min(minY, c.bounds.y)
        maxX = Math.max(maxX, c.bounds.x + c.bounds.width)
        maxY = Math.max(maxY, c.bounds.y + c.bounds.height)
    }

    const padding = 50
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const scale = Math.min(MINIMAP_WIDTH / contentWidth, MINIMAP_HEIGHT / contentHeight)

    // Viewport rect in minimap coordinates
    const vpX = (-panX / zoom - minX) * scale
    const vpY = (-panY / zoom - minY) * scale
    // Approximate viewport size (assuming window is ~800x600 / zoom)
    const vpW = (800 / zoom) * scale
    const vpH = (600 / zoom) * scale

    function handleMinimapClick(e: React.MouseEvent<SVGSVGElement>) {
        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top
        const canvasX = clickX / scale + minX
        const canvasY = clickY / scale + minY
        setPan(-canvasX * zoom + 400, -canvasY * zoom + 300)
    }

    return (
        <div className="absolute bottom-4 right-4 z-30 rounded border border-gray-300 bg-white/90 shadow-lg overflow-hidden">
            <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} onClick={handleMinimapClick} className="cursor-pointer">
                <rect width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} fill="#fafafa" />
                {page.components.map((c) => (
                    <rect
                        key={c.id}
                        x={(c.bounds.x - minX) * scale}
                        y={(c.bounds.y - minY) * scale}
                        width={c.bounds.width * scale}
                        height={c.bounds.height * scale}
                        fill="#ddd"
                        stroke="#999"
                        strokeWidth={0.5}
                    />
                ))}
                <rect x={vpX} y={vpY} width={vpW} height={vpH} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth={1} />
            </svg>
        </div>
    )
}
