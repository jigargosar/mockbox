import { useCanvasStore, selectCurrentPage } from '../store/canvas-store'
import { useLayerDrag } from '../hooks/use-layer-drag'

export function LayersPanel() {
    const page = useCanvasStore(selectCurrentPage)
    const selectedIds = useCanvasStore((s) => s.selectedIds)
    const select = useCanvasStore((s) => s.select)
    const toggleVisibility = useCanvasStore((s) => s.toggleVisibility)
    const toggleLock = useCanvasStore((s) => s.toggleLock)
    const renameComponent = useCanvasStore((s) => s.renameComponent)

    const sorted = [...page.components].sort((a, b) => b.zIndex - a.zIndex)
    const { draggedId, dropIndex, onPointerDown, containerRef } = useLayerDrag(sorted.length)

    return (
        <div className="flex flex-col border-t border-gray-200">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Layers</span>
                <span className="text-[10px] text-gray-400">{sorted.length}</span>
            </div>
            <div className="max-h-48 overflow-y-auto" ref={containerRef}>
                {sorted.map((component, visualIndex) => {
                    const isSelected = selectedIds.includes(component.id)
                    const isDragged = draggedId === component.id
                    const showDropBefore = dropIndex === visualIndex
                    return (
                        <div key={component.id} data-layer-row>
                            {showDropBefore && <div className="h-0.5 bg-blue-500 mx-1" />}
                            <div
                                className={`flex items-center gap-1 px-2 py-1 text-xs cursor-pointer border-b border-gray-100 ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'} ${isDragged ? 'opacity-40' : ''}`}
                                onClick={(e) => select(component.id, e.shiftKey)}
                            >
                                <span
                                    className="shrink-0 w-4 text-center cursor-grab text-gray-400 text-[10px] select-none"
                                    onPointerDown={(e) => onPointerDown(component.id, e)}
                                    title="Drag to reorder"
                                >
                                    &#x2261;
                                </span>
                                <button
                                    className="shrink-0 text-[10px] w-4 text-center"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleVisibility(component.id)
                                    }}
                                    title={component.visible ? 'Hide' : 'Show'}
                                >
                                    {component.visible ? '\u{1F441}' : '\u{1F6AB}'}
                                </button>
                                <button
                                    className="shrink-0 text-[10px] w-4 text-center"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleLock(component.id)
                                    }}
                                    title={component.locked ? 'Unlock' : 'Lock'}
                                >
                                    {component.locked ? '\u{1F512}' : '\u{1F513}'}
                                </button>
                                <input
                                    type="text"
                                    value={component.name}
                                    onChange={(e) => renameComponent(component.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 bg-transparent text-xs truncate focus:outline-none focus:bg-white focus:border-blue-300 focus:border rounded px-1"
                                />
                                <span className="shrink-0 text-[9px] text-gray-400">{component.kind}</span>
                            </div>
                        </div>
                    )
                })}
                {dropIndex === sorted.length && sorted.length > 0 && (
                    <div className="h-0.5 bg-blue-500 mx-1" />
                )}
                {sorted.length === 0 && <div className="p-3 text-xs text-gray-400 text-center">No components</div>}
            </div>
        </div>
    )
}
