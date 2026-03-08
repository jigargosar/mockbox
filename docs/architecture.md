Mockbox — Architecture Reference

# Stack

- Vite + TypeScript + React 19 + Tailwind v4
- roughjs (sketchy SVG rendering)
- zustand v5 (state management)
- jsPDF (PDF export)
- localStorage for persistence (no backend)
- pnpm
- konva is installed but unused (SVG approach used instead)

# Source Layout

+-----+=================================================+==========================================+
| #   | File                                            | Purpose                                  |
+-----+=================================================+==========================================+
| 1   | src/store/canvas-store.ts                       | Zustand store: components, selection,    |
|     |                                                 | pages, undo/redo, hotspots, grouping,    |
|     |                                                 | jumpToHistory                            |
+-----+-------------------------------------------------+------------------------------------------+
| 2   | src/types/component.ts                          | WireframeComponent, Page, Project,       |
|     |                                                 | Hotspot, branded ID types                |
+-----+-------------------------------------------------+------------------------------------------+
| 3   | src/types/palette-registry.ts                   | 37 component kinds across 7 categories   |
+-----+-------------------------------------------------+------------------------------------------+
| 4   | src/renderers/sketchy.ts                        | roughjs SVG rendering per component type |
+-----+-------------------------------------------------+------------------------------------------+
| 5   | src/renderers/clean.ts                          | Clean SVG rendering alternative           |
+-----+-------------------------------------------------+------------------------------------------+
| 6   | src/hooks/use-canvas-interactions.ts            | Pan, zoom, select, drag, resize,         |
|     |                                                 | marquee, deferred multi-select           |
+-----+-------------------------------------------------+------------------------------------------+
| 7   | src/hooks/use-keyboard-shortcuts.ts             | Keyboard shortcuts: clipboard, z-order,  |
|     |                                                 | Tab cycling, zoom, undo/redo             |
+-----+-------------------------------------------------+------------------------------------------+
| 8   | src/hooks/use-layer-drag.ts                     | Pointer-based drag-to-reorder for        |
|     |                                                 | layers panel                             |
+-----+-------------------------------------------------+------------------------------------------+
| 9   | src/utils/alignment.ts                          | Snap-to-grid                             |
+-----+-------------------------------------------------+------------------------------------------+
| 10  | src/utils/export.ts                             | PNG/PDF/SVG export                       |
+-----+-------------------------------------------------+------------------------------------------+
| 11  | src/utils/persistence.ts                        | localStorage save/load                   |
+-----+-------------------------------------------------+------------------------------------------+
| 12  | src/utils/id.ts                                 | Branded ID generation                    |
+-----+-------------------------------------------------+------------------------------------------+
| 13  | src/utils/toast.ts                              | Toast notification store + toast()       |
+-----+-------------------------------------------------+------------------------------------------+

# Components

+-----+=================================================+==========================================+
| #   | Component                                       | Purpose                                  |
+-----+=================================================+==========================================+
| 1   | App.tsx                                         | Layout shell: toolbar top, palette left, |
|     |                                                 | canvas center, panels right              |
+-----+-------------------------------------------------+------------------------------------------+
| 2   | Canvas.tsx                                      | SVG canvas with roughjs rendering,       |
|     |                                                 | bounds-based hit testing, hover outline, |
|     |                                                 | placement preview, context menu,         |
|     |                                                 | group/multi-select bounding boxes,       |
|     |                                                 | locked indicators                        |
+-----+-------------------------------------------------+------------------------------------------+
| 3   | Palette.tsx                                     | Component palette sidebar: categories,   |
|     |                                                 | search, favorites                        |
+-----+-------------------------------------------------+------------------------------------------+
| 4   | PropertyPanel.tsx                               | Context-sensitive property editor:       |
|     |                                                 | dims, content, typography, style, state  |
+-----+-------------------------------------------------+------------------------------------------+
| 5   | LayersPanel.tsx                                 | Z-order layer list: drag reorder,        |
|     |                                                 | visibility/lock toggles, group nesting   |
+-----+-------------------------------------------------+------------------------------------------+
| 6   | PagesPanel.tsx                                  | Page management: add, rename, duplicate, |
|     |                                                 | delete, switch                           |
+-----+-------------------------------------------------+------------------------------------------+
| 7   | Toolbar.tsx                                     | Undo/redo, selection actions, zoom,      |
|     |                                                 | view toggles, render mode, hotspot,      |
|     |                                                 | present                                  |
+-----+-------------------------------------------------+------------------------------------------+
| 8   | Minimap.tsx                                     | Canvas minimap (toggle via toolbar)      |
+-----+-------------------------------------------------+------------------------------------------+
| 9   | PresentationMode.tsx                            | Fullscreen prototype viewer: hotspot     |
|     |                                                 | click navigation, arrow key nav          |
+-----+-------------------------------------------------+------------------------------------------+
| 10  | HistoryPanel.tsx                                | Clickable undo/redo list: jump to any    |
|     |                                                 | history state                            |
+-----+-------------------------------------------------+------------------------------------------+
| 11  | Toast.tsx                                       | Toast notification container             |
+-----+-------------------------------------------------+------------------------------------------+
| 12  | ShortcutOverlay.tsx                             | Keyboard shortcut cheatsheet modal       |
+-----+-------------------------------------------------+------------------------------------------+
| 13  | ExportMenu.tsx                                  | File menu: export JSON/PDF, import,      |
|     |                                                 | with toast feedback                      |
+-----+-------------------------------------------------+------------------------------------------+
| 14  | ErrorBoundary.tsx                               | React error boundary                     |
+-----+-------------------------------------------------+------------------------------------------+

# Key Decisions

1. SVG + roughjs for canvas (DOM-based) instead of HTML Canvas.
   konva is installed as a fallback but unused.

2. Bounds-based hit testing instead of DOM-based (target.closest).
   DOM-based fails when overlay elements (selection outlines, locked indicators)
   intercept clicks. Bounds-based checks click position against component bounds
   directly, making the full bounding box clickable.

3. Command-based undo/redo via zustand. Every mutation goes through
   executeCommand which stores redo/undo closures.

4. Deferred single-select on mouseup. When clicking an already-selected
   component, selection change is deferred to mouseup. If a drag occurred,
   selection stays (preserving multi-drag). If no drag, narrows to single.

5. localStorage persistence (not IndexedDB yet). Simple but sufficient
   for the current single-project workflow.

6. Branded ID types (ComponentId, PageId, etc.) for compile-time safety.

7. Grouping expands selection. Clicking any group member selects all members.
   The store's select() and marqueeSelect() both expand to full group membership.

# Known Issues and Gotchas

1. zustand v5 + React 19 selector stability: Selectors using .filter()
   or .map() create new array refs every call, causing infinite re-renders
   via useSyncExternalStore. Must wrap with useShallow from
   zustand/react/shallow. Watch for this in any new selectors.

2. Each drag/resize movement creates a separate undo entry. No debouncing
   yet — dragging a component 100px creates many undo steps.

3. Resize handles use a two-layer approach: invisible 20x20 hit area rect
   on top, visible 8x8 rect behind (pointerEvents="none"). Handle detection
   is DOM-based (data-handle attribute), while component detection is
   bounds-based. These two systems coexist in handleCanvasMouseDown.

4. Components rendered by roughjs have transparent fills. Invisible hit area
   rects are inserted as first child of each component's <g> element in the
   imperative render useEffect to make the full bounds clickable.

5. Palette uses click-to-activate then click-on-canvas to place, not
   drag-from-palette. Escape cancels placement mode.

6. No double-click to enter group. Selecting a grouped component always
   selects the entire group. Individual member editing requires ungrouping.

7. PropertyPanel has redundant w-56 + border-l classes (parent already
   provides these via the right sidebar container).

8. Component state field (default/hover/active/focused/disabled) is stored
   as metadata but has no visual effect on canvas rendering.
