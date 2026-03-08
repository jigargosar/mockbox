import { useCanvasStore } from '../store/canvas-store'

export function HistoryPanel() {
    const history = useCanvasStore((s) => s.history)
    const historyIndex = useCanvasStore((s) => s.historyIndex)

    if (history.length === 0) {
        return (
            <div className="border-t border-gray-200 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">History</div>
                <div className="text-xs text-gray-400">No actions yet</div>
            </div>
        )
    }

    return (
        <div className="border-t border-gray-200">
            <div className="px-3 py-2 border-b border-gray-200">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">History</span>
            </div>
            <div className="max-h-32 overflow-y-auto">
                {history.map((command, i) => (
                    <div
                        key={i}
                        className={`px-3 py-1 text-xs border-b border-gray-100 ${i <= historyIndex ? 'text-gray-700' : 'text-gray-300'}`}
                    >
                        {command.description}
                    </div>
                ))}
            </div>
        </div>
    )
}
