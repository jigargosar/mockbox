import { useEffect } from 'react'
import { useCanvasStore } from '../store/canvas-store'

const ARROW_STEP = 1
const ARROW_SHIFT_STEP = 10

export function useKeyboardShortcuts() {
    const store = useCanvasStore

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

            const ctrl = e.ctrlKey || e.metaKey
            const shift = e.shiftKey

            switch (e.key) {
                case 'z':
                    if (ctrl && shift) {
                        e.preventDefault()
                        store.getState().redo()
                    } else if (ctrl) {
                        e.preventDefault()
                        store.getState().undo()
                    }
                    break
                case 'y':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().redo()
                    }
                    break
                case 'c':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().copySelected()
                    }
                    break
                case 'v':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().pasteClipboard()
                    }
                    break
                case 'x':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().cutSelected()
                    }
                    break
                case 'd':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().duplicateSelected()
                    }
                    break
                case 'a':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().selectAll()
                    }
                    break
                case 'g':
                    if (ctrl && shift) {
                        e.preventDefault()
                        store.getState().ungroupSelected()
                    } else if (ctrl) {
                        e.preventDefault()
                        store.getState().groupSelected()
                    }
                    break
                case ']':
                    if (ctrl && shift) {
                        e.preventDefault()
                        store.getState().bringToFront()
                    } else if (ctrl) {
                        e.preventDefault()
                        store.getState().moveUp()
                    }
                    break
                case '[':
                    if (ctrl && shift) {
                        e.preventDefault()
                        store.getState().sendToBack()
                    } else if (ctrl) {
                        e.preventDefault()
                        store.getState().moveDown()
                    }
                    break
                case 'Delete':
                case 'Backspace':
                    e.preventDefault()
                    store.getState().deleteSelected()
                    break
                case 'Escape': {
                    const s = store.getState()
                    if (s.draggingKind) {
                        s.setDraggingKind(null)
                    } else if (s.hotspotMode) {
                        s.toggleHotspotMode()
                    } else if (s.presentationMode) {
                        s.togglePresentation()
                    } else {
                        s.clearSelection()
                    }
                    break
                }
                case 'ArrowUp':
                    e.preventDefault()
                    store.getState().moveSelected(0, shift ? -ARROW_SHIFT_STEP : -ARROW_STEP)
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    store.getState().moveSelected(0, shift ? ARROW_SHIFT_STEP : ARROW_STEP)
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    store.getState().moveSelected(shift ? -ARROW_SHIFT_STEP : -ARROW_STEP, 0)
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    store.getState().moveSelected(shift ? ARROW_SHIFT_STEP : ARROW_STEP, 0)
                    break
                case '=':
                case '+':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().zoomIn()
                    }
                    break
                case '-':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().zoomOut()
                    }
                    break
                case '0':
                    if (ctrl) {
                        e.preventDefault()
                        store.getState().zoomToFit()
                    }
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])
}
