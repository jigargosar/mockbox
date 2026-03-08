import { useCanvasStore } from '../store/canvas-store'
import type { RenderMode } from '../types/component'

export function Toolbar() {
    const zoom = useCanvasStore((s) => s.zoom)
    const zoomIn = useCanvasStore((s) => s.zoomIn)
    const zoomOut = useCanvasStore((s) => s.zoomOut)
    const zoomToFit = useCanvasStore((s) => s.zoomToFit)
    const undo = useCanvasStore((s) => s.undo)
    const redo = useCanvasStore((s) => s.redo)
    const historyIndex = useCanvasStore((s) => s.historyIndex)
    const historyLength = useCanvasStore((s) => s.history.length)
    const renderMode = useCanvasStore((s) => s.renderMode)
    const setRenderMode = useCanvasStore((s) => s.setRenderMode)
    const toggleRulers = useCanvasStore((s) => s.toggleRulers)
    const showRulers = useCanvasStore((s) => s.showRulers)
    const toggleMinimap = useCanvasStore((s) => s.toggleMinimap)
    const showMinimap = useCanvasStore((s) => s.showMinimap)
    const togglePresentation = useCanvasStore((s) => s.togglePresentation)
    const hotspotMode = useCanvasStore((s) => s.hotspotMode)
    const toggleHotspotMode = useCanvasStore((s) => s.toggleHotspotMode)
    const selectedIds = useCanvasStore((s) => s.selectedIds)
    const deleteSelected = useCanvasStore((s) => s.deleteSelected)
    const duplicateSelected = useCanvasStore((s) => s.duplicateSelected)
    const bringToFront = useCanvasStore((s) => s.bringToFront)
    const sendToBack = useCanvasStore((s) => s.sendToBack)
    const groupSelected = useCanvasStore((s) => s.groupSelected)
    const ungroupSelected = useCanvasStore((s) => s.ungroupSelected)
    const projectName = useCanvasStore((s) => s.project.name)

    const hasSelection = selectedIds.length > 0

    return (
        <div className="flex h-10 items-center gap-1 border-b border-gray-200 bg-white px-3">
            {/* Project name */}
            <span className="text-sm font-semibold text-gray-700 mr-4">{projectName}</span>

            <Divider />

            {/* Undo/Redo */}
            <ToolbarButton label="Undo" shortcut="Ctrl+Z" onClick={undo} disabled={historyIndex < 0}>
                ↩
            </ToolbarButton>
            <ToolbarButton label="Redo" shortcut="Ctrl+Shift+Z" onClick={redo} disabled={historyIndex >= historyLength - 1}>
                ↪
            </ToolbarButton>

            <Divider />

            {/* Selection actions */}
            <ToolbarButton label="Delete" onClick={deleteSelected} disabled={!hasSelection}>
                🗑
            </ToolbarButton>
            <ToolbarButton label="Duplicate" shortcut="Ctrl+D" onClick={duplicateSelected} disabled={!hasSelection}>
                ⧉
            </ToolbarButton>
            <ToolbarButton label="Group" shortcut="Ctrl+G" onClick={groupSelected} disabled={selectedIds.length < 2}>
                ⊞
            </ToolbarButton>
            <ToolbarButton label="Ungroup" shortcut="Ctrl+Shift+G" onClick={ungroupSelected} disabled={!hasSelection}>
                ⊟
            </ToolbarButton>
            <ToolbarButton label="Bring to Front" onClick={bringToFront} disabled={!hasSelection}>
                ⤒
            </ToolbarButton>
            <ToolbarButton label="Send to Back" onClick={sendToBack} disabled={!hasSelection}>
                ⤓
            </ToolbarButton>

            <Divider />

            {/* Zoom */}
            <ToolbarButton label="Zoom Out" onClick={zoomOut}>
                −
            </ToolbarButton>
            <button
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                onClick={zoomToFit}
                title="Reset zoom"
            >
                {Math.round(zoom * 100)}%
            </button>
            <ToolbarButton label="Zoom In" onClick={zoomIn}>
                +
            </ToolbarButton>

            <div className="flex-1" />

            {/* View toggles */}
            <ToolbarButton label="Rulers" onClick={toggleRulers} active={showRulers}>
                📏
            </ToolbarButton>
            <ToolbarButton label="Minimap" onClick={toggleMinimap} active={showMinimap}>
                🗺
            </ToolbarButton>

            <Divider />

            {/* Render mode */}
            <select
                value={renderMode}
                onChange={(e) => setRenderMode(e.target.value as RenderMode)}
                className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
            >
                <option value="sketchy">Sketchy</option>
                <option value="clean">Clean</option>
            </select>

            <Divider />

            {/* Hotspot mode */}
            <ToolbarButton label="Hotspot" onClick={toggleHotspotMode} active={hotspotMode}>
                ◎
            </ToolbarButton>

            {/* Present */}
            <ToolbarButton label="Present" onClick={togglePresentation}>
                ▶
            </ToolbarButton>
        </div>
    )
}

function ToolbarButton({
    children,
    label,
    shortcut,
    onClick,
    disabled = false,
    active = false,
}: {
    children: React.ReactNode
    label: string
    shortcut?: string
    onClick: () => void
    disabled?: boolean
    active?: boolean
}) {
    return (
        <button
            className={`rounded px-2 py-1 text-sm transition-colors ${active ? 'bg-blue-100 text-blue-600' : disabled ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            onClick={onClick}
            disabled={disabled}
            title={shortcut ? `${label} (${shortcut})` : label}
        >
            {children}
        </button>
    )
}

function Divider() {
    return <div className="mx-1 h-5 w-px bg-gray-200" />
}
