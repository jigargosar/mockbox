import { useState, useRef } from 'react'
import { useCanvasStore } from '../store/canvas-store'
import { exportProject, importProject } from '../utils/persistence'
import { exportProjectAsPdf } from '../utils/export'

export function ExportMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const project = useCanvasStore((s) => s.project)
    const renderMode = useCanvasStore((s) => s.renderMode)
    const autoSave = useCanvasStore((s) => s.autoSave)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleExportJson() {
        const json = exportProject(project)
        const blob = new Blob([json], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${project.name}.mockbox`
        a.click()
        URL.revokeObjectURL(a.href)
        setIsOpen(false)
    }

    function handleExportPdf() {
        exportProjectAsPdf(project, renderMode).catch(console.error)
        setIsOpen(false)
    }

    function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            const imported = importProject(reader.result as string)
            useCanvasStore.setState({
                project: imported,
                currentPageId: imported.pages[0].id,
                selectedIds: [],
                history: [],
                historyIndex: -1,
            })
            autoSave()
        }
        reader.readAsText(file)
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <button
                className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                File
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded border border-gray-200 bg-white py-1 shadow-lg">
                        <button
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                            onClick={handleExportJson}
                        >
                            Export as .mockbox
                        </button>
                        <button
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                            onClick={handleExportPdf}
                        >
                            Export as PDF
                        </button>
                        <button
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Import .mockbox
                        </button>
                        <input ref={fileInputRef} type="file" accept=".mockbox,.json" className="hidden" onChange={handleImportJson} />
                    </div>
                </>
            )}
        </div>
    )
}
