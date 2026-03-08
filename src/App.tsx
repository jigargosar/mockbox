import { Canvas } from './components/Canvas'
import { Palette } from './components/Palette'
import { PropertyPanel } from './components/PropertyPanel'
import { LayersPanel } from './components/LayersPanel'
import { PagesPanel } from './components/PagesPanel'
import { Toolbar } from './components/Toolbar'
import { Minimap } from './components/Minimap'
import { HistoryPanel } from './components/HistoryPanel'
import { PresentationMode } from './components/PresentationMode'
import { ShortcutOverlay } from './components/ShortcutOverlay'
import { ExportMenu } from './components/ExportMenu'
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts'
import { ErrorBoundary } from './components/ErrorBoundary'

export function App() {
    useKeyboardShortcuts()

    return (
        <ErrorBoundary>
            <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50">
                {/* Top bar */}
                <div className="flex items-center border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-1 px-3">
                        <ExportMenu />
                    </div>
                    <Toolbar />
                </div>

                {/* Main area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left sidebar: Palette */}
                    <Palette />

                    {/* Canvas */}
                    <div className="relative flex-1">
                        <Canvas />
                        <Minimap />
                    </div>

                    {/* Right sidebar: Properties + Layers + Pages + History */}
                    <div className="flex h-full w-56 flex-col border-l border-gray-200 bg-gray-50 overflow-hidden">
                        <div className="flex-1 overflow-y-auto">
                            <PropertyPanel />
                        </div>
                        <LayersPanel />
                        <PagesPanel />
                        <HistoryPanel />
                    </div>
                </div>

                {/* Presentation mode overlay */}
                <PresentationMode />

                {/* Shortcuts help */}
                <ShortcutOverlay />
            </div>
        </ErrorBoundary>
    )
}
