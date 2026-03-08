import { useCanvasStore } from '../store/canvas-store'

export function HistoryPanel() {
    const history = useCanvasStore((s) => s.history)
    const historyIndex = useCanvasStore((s) => s.historyIndex)
    const jumpToHistory = useCanvasStore((s) => s.jumpToHistory)

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
                {history.map((command, i) => {
                    const isCurrent = i === historyIndex
                    const isPast = i <= historyIndex
                    return (
                        <button
                            key={i}
                            className={`w-full text-left px-3 py-1 text-xs border-b border-gray-100 cursor-pointer ${
                                isCurrent
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : isPast
                                      ? 'text-gray-700 hover:bg-gray-50'
                                      : 'text-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => jumpToHistory(i)}
                            title={isPast ? 'Click to undo to this point' : 'Click to redo to this point'}
                        >
                            {command.description}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
