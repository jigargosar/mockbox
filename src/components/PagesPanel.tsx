import { useState } from 'react'
import { useCanvasStore } from '../store/canvas-store'
import type { PageId } from '../types/component'

export function PagesPanel() {
    const pages = useCanvasStore((s) => s.project.pages)
    const currentPageId = useCanvasStore((s) => s.currentPageId)
    const setCurrentPage = useCanvasStore((s) => s.setCurrentPage)
    const addPage = useCanvasStore((s) => s.addPage)
    const deletePage = useCanvasStore((s) => s.deletePage)
    const renamePage = useCanvasStore((s) => s.renamePage)
    const duplicatePage = useCanvasStore((s) => s.duplicatePage)
    const [editingId, setEditingId] = useState<PageId | null>(null)
    const [editName, setEditName] = useState('')

    function startRename(pageId: PageId, name: string) {
        setEditingId(pageId)
        setEditName(name)
    }

    function commitRename() {
        if (editingId && editName.trim()) {
            renamePage(editingId, editName.trim())
        }
        setEditingId(null)
    }

    return (
        <div className="flex flex-col border-t border-gray-200">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pages</span>
                <button
                    className="text-xs text-blue-500 hover:text-blue-700"
                    onClick={() => addPage(`Page ${pages.length + 1}`)}
                    title="Add page"
                >
                    +
                </button>
            </div>
            <div className="max-h-36 overflow-y-auto">
                {pages.map((page) => {
                    const isCurrent = page.id === currentPageId
                    const isEditing = page.id === editingId
                    return (
                        <div
                            key={page.id}
                            className={`group flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer border-b border-gray-100 ${isCurrent ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                            onClick={() => setCurrentPage(page.id)}
                        >
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onBlur={commitRename}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') commitRename()
                                        if (e.key === 'Escape') setEditingId(null)
                                    }}
                                    className="flex-1 rounded border border-blue-300 px-1 py-0.5 text-xs focus:outline-none"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className="flex-1 truncate"
                                    onDoubleClick={(e) => {
                                        e.stopPropagation()
                                        startRename(page.id, page.name)
                                    }}
                                >
                                    {page.name}
                                </span>
                            )}
                            <div className="flex gap-1 shrink-0">
                                <button
                                    className="text-[10px] text-gray-400 hover:text-blue-500"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        duplicatePage(page.id)
                                    }}
                                    title="Duplicate"
                                >
                                    ⧉
                                </button>
                                {pages.length > 1 && (
                                    <button
                                        className="text-[10px] text-gray-400 hover:text-red-500"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deletePage(page.id)
                                        }}
                                        title="Delete"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
