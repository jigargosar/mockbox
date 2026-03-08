import { create } from 'zustand'
import type {
    Bounds,
    ComponentId,
    ComponentKind,
    ComponentState,
    ComponentStyle,
    Hotspot,
    HotspotId,
    Page,
    PageId,
    Project,
    RenderMode,
    WireframeComponent,
} from '../types/component'
import { createComponentId, createHotspotId, createPageId, createProjectId } from '../utils/id'
import { saveProject, loadAllProjects, loadCurrentProjectId } from '../utils/persistence'
import { PALETTE_ENTRIES } from '../types/palette-registry'

type Command = {
    readonly description: string
    readonly undo: () => void
    readonly redo: () => void
}

type CanvasStore = {
    // Project
    project: Project
    allProjects: Project[]

    // View
    currentPageId: PageId
    panX: number
    panY: number
    zoom: number
    gridSize: number
    renderMode: RenderMode
    showRulers: boolean
    showMinimap: boolean

    // Selection
    selectedIds: readonly ComponentId[]
    clipboard: readonly WireframeComponent[]

    // Drag state
    draggingKind: ComponentKind | null

    // History
    history: readonly Command[]
    historyIndex: number

    // Presentation
    presentationMode: boolean

    // Hotspot
    hotspotMode: boolean
    selectedHotspotId: HotspotId | null

    // Project actions
    createNewProject: (name: string) => void
    loadProject: (projectId: string) => void
    refreshProjectList: () => void
    autoSave: () => void

    // Page actions
    addPage: (name: string) => void
    deletePage: (pageId: PageId) => void
    renamePage: (pageId: PageId, name: string) => void
    duplicatePage: (pageId: PageId) => void
    reorderPage: (pageId: PageId, newIndex: number) => void
    setCurrentPage: (pageId: PageId) => void

    // Component actions
    addComponent: (kind: ComponentKind, x: number, y: number) => void
    updateComponent: (id: ComponentId, updates: Partial<WireframeComponent>) => void
    deleteSelected: () => void
    duplicateSelected: () => void
    moveSelected: (dx: number, dy: number) => void
    resizeComponent: (id: ComponentId, bounds: Bounds) => void

    // Selection
    select: (id: ComponentId, additive: boolean) => void
    selectAll: () => void
    clearSelection: () => void
    marqueeSelect: (bounds: Bounds) => void

    // Clipboard
    copySelected: () => void
    pasteClipboard: () => void
    cutSelected: () => void

    // Grouping
    groupSelected: () => void
    ungroupSelected: () => void

    // Layer ordering
    bringToFront: () => void
    sendToBack: () => void
    moveUp: () => void
    moveDown: () => void
    reorderComponentZ: (componentId: ComponentId, targetIndex: number) => void
    toggleVisibility: (id: ComponentId) => void
    toggleLock: (id: ComponentId) => void
    renameComponent: (id: ComponentId, name: string) => void

    // Property editing
    setComponentStyle: (id: ComponentId, style: Partial<ComponentStyle>) => void
    setComponentState: (id: ComponentId, state: ComponentState) => void
    setComponentText: (id: ComponentId, text: string) => void

    // View actions
    setPan: (x: number, y: number) => void
    setZoom: (zoom: number) => void
    zoomIn: () => void
    zoomOut: () => void
    zoomToFit: () => void
    setGridSize: (size: number) => void
    setRenderMode: (mode: RenderMode) => void
    toggleRulers: () => void
    toggleMinimap: () => void

    // History
    undo: () => void
    redo: () => void

    // Drag
    setDraggingKind: (kind: ComponentKind | null) => void

    // Presentation
    togglePresentation: () => void

    // Favorites
    favorites: readonly ComponentKind[]
    toggleFavorite: (kind: ComponentKind) => void

    // Search
    paletteSearch: string
    setPaletteSearch: (query: string) => void

    // Hotspot actions
    toggleHotspotMode: () => void
    addHotspot: (sourcePageId: PageId, targetPageId: PageId, bounds: Bounds) => void
    deleteHotspot: (id: HotspotId) => void
    updateHotspot: (id: HotspotId, updates: Partial<Omit<Hotspot, 'id'>>) => void
    selectHotspot: (id: HotspotId | null) => void
}

function createDefaultPage(): Page {
    const id = createPageId()
    return { id, name: 'Page 1', components: [] }
}

function createDefaultProject(): Project {
    const page = createDefaultPage()
    return {
        id: createProjectId(),
        name: 'Untitled',
        pages: [page],
        hotspots: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
}

function loadInitialProject(): { project: Project; currentPageId: PageId } {
    const allProjects = loadAllProjects()
    const currentId = loadCurrentProjectId()
    const found = allProjects.find((p) => p.id === currentId)
    if (found && found.pages.length > 0) {
        return { project: found, currentPageId: found.pages[0].id }
    }
    const project = createDefaultProject()
    return { project, currentPageId: project.pages[0].id }
}

function loadFavorites(): ComponentKind[] {
    const raw = localStorage.getItem('mockbox-favorites')
    if (!raw) return []
    return JSON.parse(raw) as ComponentKind[]
}

const initial = loadInitialProject()

export const useCanvasStore = create<CanvasStore>((set, get) => {
    function executeCommand(command: Command) {
        command.redo()
        set((s) => ({
            history: [...s.history.slice(0, s.historyIndex + 1), command],
            historyIndex: s.historyIndex + 1,
        }))
        get().autoSave()
    }

    function updatePageComponents(pageId: PageId, updater: (components: readonly WireframeComponent[]) => readonly WireframeComponent[]) {
        set((s) => ({
            project: {
                ...s.project,
                pages: s.project.pages.map((p) => (p.id === pageId ? { ...p, components: updater(p.components) } : p)),
            },
        }))
    }

    function currentPageComponents(): readonly WireframeComponent[] {
        const s = get()
        return s.project.pages.find((p) => p.id === s.currentPageId)?.components ?? []
    }

    return {
        project: initial.project,
        allProjects: loadAllProjects(),
        currentPageId: initial.currentPageId,
        panX: 0,
        panY: 0,
        zoom: 1,
        gridSize: 10,
        renderMode: 'sketchy',
        showRulers: true,
        showMinimap: false,
        selectedIds: [],
        clipboard: [],
        draggingKind: null,
        history: [],
        historyIndex: -1,
        presentationMode: false,
        hotspotMode: false,
        selectedHotspotId: null,
        favorites: loadFavorites(),
        paletteSearch: '',

        createNewProject: (name) => {
            const project = { ...createDefaultProject(), name }
            set({ project, currentPageId: project.pages[0].id, selectedIds: [], history: [], historyIndex: -1 })
            saveProject(project)
            get().refreshProjectList()
        },

        loadProject: (projectId) => {
            const found = get().allProjects.find((p) => p.id === projectId)
            if (!found) return
            set({ project: found, currentPageId: found.pages[0].id, selectedIds: [], history: [], historyIndex: -1 })
        },

        refreshProjectList: () => set({ allProjects: loadAllProjects() }),

        autoSave: () => saveProject(get().project),

        addPage: (name) => {
            const page: Page = { id: createPageId(), name, components: [] }
            set((s) => ({ project: { ...s.project, pages: [...s.project.pages, page] } }))
            get().autoSave()
        },

        deletePage: (pageId) => {
            const s = get()
            if (s.project.pages.length <= 1) return
            const pages = s.project.pages.filter((p) => p.id !== pageId)
            const currentPageId = s.currentPageId === pageId ? pages[0].id : s.currentPageId
            set({ project: { ...s.project, pages }, currentPageId, selectedIds: [] })
            get().autoSave()
        },

        renamePage: (pageId, name) => {
            set((s) => ({
                project: { ...s.project, pages: s.project.pages.map((p) => (p.id === pageId ? { ...p, name } : p)) },
            }))
            get().autoSave()
        },

        duplicatePage: (pageId) => {
            const s = get()
            const page = s.project.pages.find((p) => p.id === pageId)
            if (!page) return
            const newPage: Page = {
                id: createPageId(),
                name: `${page.name} (copy)`,
                components: page.components.map((c) => ({ ...c, id: createComponentId() })),
            }
            const idx = s.project.pages.findIndex((p) => p.id === pageId)
            const pages = [...s.project.pages]
            pages.splice(idx + 1, 0, newPage)
            set({ project: { ...s.project, pages } })
            get().autoSave()
        },

        reorderPage: (pageId, newIndex) => {
            set((s) => {
                const pages = [...s.project.pages]
                const oldIndex = pages.findIndex((p) => p.id === pageId)
                if (oldIndex < 0) return s
                const [page] = pages.splice(oldIndex, 1)
                pages.splice(newIndex, 0, page)
                return { project: { ...s.project, pages } }
            })
            get().autoSave()
        },

        setCurrentPage: (pageId) => set({ currentPageId: pageId, selectedIds: [] }),

        addComponent: (kind, x, y) => {
            const entry = PALETTE_ENTRIES.find((e) => e.kind === kind)
            if (!entry) return
            const pageId = get().currentPageId
            const components = currentPageComponents()
            const maxZ = components.reduce((max, c) => Math.max(max, c.zIndex), 0)
            const component: WireframeComponent = {
                id: createComponentId(),
                kind,
                bounds: { x, y, width: entry.defaultSize.width, height: entry.defaultSize.height },
                rotation: 0,
                text: entry.label,
                placeholder: '',
                state: 'default',
                locked: false,
                visible: true,
                name: entry.label,
                groupId: null,
                style: {
                    fill: 'transparent',
                    stroke: '#333333',
                    strokeWidth: 2,
                    cornerRadius: 3,
                    opacity: 1,
                    fontSize: 14,
                    fontWeight: 400,
                    textAlign: 'center',
                },
                zIndex: maxZ + 1,
            }

            const prev = [...components]
            executeCommand({
                description: `Add ${entry.label}`,
                redo: () => updatePageComponents(pageId, () => [...prev, component]),
                undo: () => updatePageComponents(pageId, () => prev),
            })
            set({ selectedIds: [component.id] })
        },

        updateComponent: (id, updates) => {
            const pageId = get().currentPageId
            const prev = [...currentPageComponents()]
            const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
            executeCommand({
                description: 'Update component',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        deleteSelected: () => {
            const s = get()
            if (s.selectedIds.length === 0) return
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const ids = [...s.selectedIds]
            const next = prev.filter((c) => !ids.includes(c.id))
            executeCommand({
                description: `Delete ${ids.length} component(s)`,
                redo: () => {
                    updatePageComponents(pageId, () => next)
                    set({ selectedIds: [] })
                },
                undo: () => {
                    updatePageComponents(pageId, () => prev)
                    set({ selectedIds: ids })
                },
            })
        },

        duplicateSelected: () => {
            const s = get()
            const selected = selectCurrentPageComponents(s).filter((c) => s.selectedIds.includes(c.id))
            if (selected.length === 0) return
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const duplicates = selected.map((c) => ({
                ...c,
                id: createComponentId(),
                bounds: { ...c.bounds, x: c.bounds.x + 20, y: c.bounds.y + 20 },
                name: `${c.name} (copy)`,
            }))
            executeCommand({
                description: `Duplicate ${selected.length} component(s)`,
                redo: () => {
                    updatePageComponents(pageId, () => [...prev, ...duplicates])
                    set({ selectedIds: duplicates.map((c) => c.id) })
                },
                undo: () => {
                    updatePageComponents(pageId, () => prev)
                    set({ selectedIds: selected.map((c) => c.id) })
                },
            })
        },

        moveSelected: (dx, dy) => {
            const s = get()
            if (s.selectedIds.length === 0) return
            const pageId = s.currentPageId
            const ids = [...s.selectedIds]
            const prev = [...currentPageComponents()]
            const next = prev.map((c) =>
                ids.includes(c.id) ? { ...c, bounds: { ...c.bounds, x: c.bounds.x + dx, y: c.bounds.y + dy } } : c,
            )
            executeCommand({
                description: 'Move component(s)',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        resizeComponent: (id, bounds) => {
            const pageId = get().currentPageId
            const prev = [...currentPageComponents()]
            const next = prev.map((c) => (c.id === id ? { ...c, bounds } : c))
            executeCommand({
                description: 'Resize component',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        select: (id, additive) => {
            set((s) => {
                if (additive) {
                    const included = s.selectedIds.includes(id)
                    return { selectedIds: included ? s.selectedIds.filter((i) => i !== id) : [...s.selectedIds, id] }
                }
                return { selectedIds: [id] }
            })
        },

        selectAll: () => {
            const components = currentPageComponents()
            set({ selectedIds: components.map((c) => c.id) })
        },

        clearSelection: () => set({ selectedIds: [] }),

        marqueeSelect: (bounds) => {
            const components = currentPageComponents()
            const ids = components
                .filter(
                    (c) =>
                        c.bounds.x >= bounds.x &&
                        c.bounds.y >= bounds.y &&
                        c.bounds.x + c.bounds.width <= bounds.x + bounds.width &&
                        c.bounds.y + c.bounds.height <= bounds.y + bounds.height,
                )
                .map((c) => c.id)
            set({ selectedIds: ids })
        },

        copySelected: () => {
            const s = get()
            const selected = selectCurrentPageComponents(s).filter((c) => s.selectedIds.includes(c.id))
            set({ clipboard: selected })
        },

        pasteClipboard: () => {
            const s = get()
            if (s.clipboard.length === 0) return
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const pasted = s.clipboard.map((c) => ({
                ...c,
                id: createComponentId(),
                bounds: { ...c.bounds, x: c.bounds.x + 20, y: c.bounds.y + 20 },
            }))
            executeCommand({
                description: `Paste ${pasted.length} component(s)`,
                redo: () => {
                    updatePageComponents(pageId, () => [...prev, ...pasted])
                    set({ selectedIds: pasted.map((c) => c.id) })
                },
                undo: () => {
                    updatePageComponents(pageId, () => prev)
                    set({ selectedIds: [] })
                },
            })
        },

        cutSelected: () => {
            get().copySelected()
            get().deleteSelected()
        },

        groupSelected: () => {
            const s = get()
            if (s.selectedIds.length < 2) return
            const groupId = createComponentId()
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const ids = [...s.selectedIds]
            const next = prev.map((c) => (ids.includes(c.id) ? { ...c, groupId } : c))
            executeCommand({
                description: 'Group components',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        ungroupSelected: () => {
            const s = get()
            const selected = selectCurrentPageComponents(s).filter((c) => s.selectedIds.includes(c.id))
            const groupIds = new Set(selected.map((c) => c.groupId).filter(Boolean))
            if (groupIds.size === 0) return
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const next = prev.map((c) => (c.groupId && groupIds.has(c.groupId) ? { ...c, groupId: null } : c))
            executeCommand({
                description: 'Ungroup components',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        bringToFront: () => {
            const s = get()
            if (s.selectedIds.length === 0) return
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const maxZ = prev.reduce((max, c) => Math.max(max, c.zIndex), 0)
            let z = maxZ + 1
            const next = prev.map((c) => (s.selectedIds.includes(c.id) ? { ...c, zIndex: z++ } : c))
            executeCommand({
                description: 'Bring to front',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        sendToBack: () => {
            const s = get()
            if (s.selectedIds.length === 0) return
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const minZ = prev.reduce((min, c) => Math.min(min, c.zIndex), Infinity)
            let z = minZ - s.selectedIds.length
            const next = prev.map((c) => (s.selectedIds.includes(c.id) ? { ...c, zIndex: z++ } : c))
            executeCommand({
                description: 'Send to back',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        moveUp: () => {
            const s = get()
            if (s.selectedIds.length === 0) return
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const next = prev.map((c) => (s.selectedIds.includes(c.id) ? { ...c, zIndex: c.zIndex + 1 } : c))
            executeCommand({
                description: 'Move up',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        moveDown: () => {
            const s = get()
            if (s.selectedIds.length === 0) return
            const pageId = s.currentPageId
            const prev = [...currentPageComponents()]
            const next = prev.map((c) => (s.selectedIds.includes(c.id) ? { ...c, zIndex: c.zIndex - 1 } : c))
            executeCommand({
                description: 'Move down',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        reorderComponentZ: (componentId, targetIndex) => {
            const pageId = get().currentPageId
            const prev = [...currentPageComponents()]
            // Sort ascending by zIndex to get the current visual order (index 0 = back, last = front)
            const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex)
            const oldIndex = sorted.findIndex((c) => c.id === componentId)
            if (oldIndex < 0 || oldIndex === targetIndex) return
            const [moved] = sorted.splice(oldIndex, 1)
            sorted.splice(targetIndex, 0, moved)
            // Reassign sequential zIndex values based on the new order
            const zMap = new Map(sorted.map((c, i) => [c.id, i + 1]))
            const next = prev.map((c) => ({ ...c, zIndex: zMap.get(c.id) ?? c.zIndex }))
            executeCommand({
                description: 'Reorder layer',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        toggleVisibility: (id) => {
            set((s) => ({
                project: {
                    ...s.project,
                    pages: s.project.pages.map((p) =>
                        p.id === s.currentPageId
                            ? { ...p, components: p.components.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)) }
                            : p,
                    ),
                },
            }))
            get().autoSave()
        },

        toggleLock: (id) => {
            set((s) => ({
                project: {
                    ...s.project,
                    pages: s.project.pages.map((p) =>
                        p.id === s.currentPageId
                            ? { ...p, components: p.components.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c)) }
                            : p,
                    ),
                },
            }))
            get().autoSave()
        },

        renameComponent: (id, name) => {
            set((s) => ({
                project: {
                    ...s.project,
                    pages: s.project.pages.map((p) =>
                        p.id === s.currentPageId
                            ? { ...p, components: p.components.map((c) => (c.id === id ? { ...c, name } : c)) }
                            : p,
                    ),
                },
            }))
            get().autoSave()
        },

        setComponentStyle: (id, style) => {
            const pageId = get().currentPageId
            const prev = [...currentPageComponents()]
            const next = prev.map((c) => (c.id === id ? { ...c, style: { ...c.style, ...style } } : c))
            executeCommand({
                description: 'Change style',
                redo: () => updatePageComponents(pageId, () => next),
                undo: () => updatePageComponents(pageId, () => prev),
            })
        },

        setComponentState: (id, state) => {
            get().updateComponent(id, { state })
        },

        setComponentText: (id, text) => {
            get().updateComponent(id, { text })
        },

        setPan: (x, y) => set({ panX: x, panY: y }),
        setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
        zoomIn: () => set((s) => ({ zoom: Math.min(5, s.zoom * 1.2) })),
        zoomOut: () => set((s) => ({ zoom: Math.max(0.1, s.zoom / 1.2) })),
        zoomToFit: () => {
            // Simple reset for now
            set({ panX: 0, panY: 0, zoom: 1 })
        },
        setGridSize: (size) => set({ gridSize: size }),
        setRenderMode: (mode) => set({ renderMode: mode }),
        toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
        toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),

        undo: () => {
            const s = get()
            if (s.historyIndex < 0) return
            s.history[s.historyIndex].undo()
            set({ historyIndex: s.historyIndex - 1 })
            get().autoSave()
        },

        redo: () => {
            const s = get()
            if (s.historyIndex >= s.history.length - 1) return
            set({ historyIndex: s.historyIndex + 1 })
            s.history[s.historyIndex + 1].redo()
            get().autoSave()
        },

        setDraggingKind: (kind) => set({ draggingKind: kind }),

        togglePresentation: () => set((s) => ({ presentationMode: !s.presentationMode })),

        toggleFavorite: (kind) => {
            set((s) => {
                const next = s.favorites.includes(kind)
                    ? s.favorites.filter((k) => k !== kind)
                    : [...s.favorites, kind]
                localStorage.setItem('mockbox-favorites', JSON.stringify(next))
                return { favorites: next }
            })
        },

        setPaletteSearch: (query) => set({ paletteSearch: query }),

        toggleHotspotMode: () => set((s) => ({ hotspotMode: !s.hotspotMode, selectedHotspotId: null })),

        addHotspot: (sourcePageId, targetPageId, bounds) => {
            const hotspot: Hotspot = { id: createHotspotId(), sourcePageId, targetPageId, bounds }
            set((s) => ({
                project: { ...s.project, hotspots: [...s.project.hotspots, hotspot] },
                selectedHotspotId: hotspot.id,
            }))
            get().autoSave()
        },

        deleteHotspot: (id) => {
            set((s) => ({
                project: { ...s.project, hotspots: s.project.hotspots.filter((h) => h.id !== id) },
                selectedHotspotId: s.selectedHotspotId === id ? null : s.selectedHotspotId,
            }))
            get().autoSave()
        },

        updateHotspot: (id, updates) => {
            set((s) => ({
                project: {
                    ...s.project,
                    hotspots: s.project.hotspots.map((h) => (h.id === id ? { ...h, ...updates } : h)),
                },
            }))
            get().autoSave()
        },

        selectHotspot: (id) => set({ selectedHotspotId: id, selectedIds: [] }),
    }
})

// Selectors — use these in components instead of store methods
export function selectCurrentPage(s: CanvasStore): Page {
    return s.project.pages.find((p) => p.id === s.currentPageId) ?? s.project.pages[0]
}

export function selectCurrentPageComponents(s: CanvasStore): readonly WireframeComponent[] {
    return selectCurrentPage(s).components
}

export function selectSelectedComponents(s: CanvasStore): readonly WireframeComponent[] {
    return selectCurrentPageComponents(s).filter((c) => s.selectedIds.includes(c.id))
}

export function selectCurrentPageHotspots(s: CanvasStore): readonly Hotspot[] {
    return s.project.hotspots.filter((h) => h.sourcePageId === s.currentPageId)
}
