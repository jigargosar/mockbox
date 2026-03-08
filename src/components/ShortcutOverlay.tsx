import { useState } from 'react'

const SHORTCUTS = [
    { key: 'Ctrl+Z', action: 'Undo' },
    { key: 'Ctrl+Shift+Z', action: 'Redo' },
    { key: 'Ctrl+C', action: 'Copy' },
    { key: 'Ctrl+V', action: 'Paste' },
    { key: 'Ctrl+X', action: 'Cut' },
    { key: 'Ctrl+D', action: 'Duplicate' },
    { key: 'Ctrl+A', action: 'Select All' },
    { key: 'Ctrl+G', action: 'Group' },
    { key: 'Ctrl+Shift+G', action: 'Ungroup' },
    { key: 'Delete', action: 'Delete selected' },
    { key: 'Escape', action: 'Deselect / Exit' },
    { key: 'Arrow keys', action: 'Move selected (1px)' },
    { key: 'Shift+Arrow', action: 'Move selected (10px)' },
    { key: 'Ctrl++', action: 'Zoom in' },
    { key: 'Ctrl+-', action: 'Zoom out' },
    { key: 'Ctrl+0', action: 'Reset zoom' },
    { key: 'Middle-click drag', action: 'Pan canvas' },
    { key: 'Alt+click drag', action: 'Pan canvas' },
    { key: 'Scroll wheel', action: 'Pan canvas' },
    { key: 'Ctrl+Scroll', action: 'Zoom' },
]

export function ShortcutOverlay() {
    const [isOpen, setIsOpen] = useState(false)

    if (!isOpen) {
        return (
            <button
                className="fixed bottom-4 left-4 z-40 rounded-full bg-gray-800 text-white w-8 h-8 text-sm shadow-lg hover:bg-gray-700"
                onClick={() => setIsOpen(true)}
                title="Keyboard shortcuts (?)"
            >
                ?
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
            <div className="rounded-lg bg-white p-6 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Keyboard Shortcuts</h2>
                    <button className="text-gray-400 hover:text-gray-600" onClick={() => setIsOpen(false)}>
                        ✕
                    </button>
                </div>
                <div className="space-y-1">
                    {SHORTCUTS.map((s) => (
                        <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-gray-100">
                            <span className="text-sm text-gray-600">{s.action}</span>
                            <kbd className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">{s.key}</kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
