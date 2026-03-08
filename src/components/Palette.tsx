import { useState } from 'react'
import { useCanvasStore } from '../store/canvas-store'
import { PALETTE_ENTRIES, CATEGORIES } from '../types/palette-registry'
import type { ComponentCategory, ComponentKind } from '../types/component'

export function Palette() {
    const [expandedCategory, setExpandedCategory] = useState<ComponentCategory | null>('layout')
    const favorites = useCanvasStore((s) => s.favorites)
    const toggleFavorite = useCanvasStore((s) => s.toggleFavorite)
    const paletteSearch = useCanvasStore((s) => s.paletteSearch)
    const setPaletteSearch = useCanvasStore((s) => s.setPaletteSearch)
    const draggingKind = useCanvasStore((s) => s.draggingKind)
    const setDraggingKind = useCanvasStore((s) => s.setDraggingKind)

    function handleClick(kind: ComponentKind) {
        setDraggingKind(draggingKind === kind ? null : kind)
    }

    const filtered = paletteSearch
        ? PALETTE_ENTRIES.filter((e) => e.label.toLowerCase().includes(paletteSearch.toLowerCase()))
        : PALETTE_ENTRIES

    const favoriteEntries = PALETTE_ENTRIES.filter((e) => favorites.includes(e.kind))

    return (
        <div className="flex h-full w-56 flex-col border-r border-gray-200 bg-gray-50">
            {/* Search */}
            <div className="p-2">
                <input
                    type="text"
                    value={paletteSearch}
                    onChange={(e) => setPaletteSearch(e.target.value)}
                    placeholder="Search components..."
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Favorites */}
                {favoriteEntries.length > 0 && !paletteSearch && (
                    <div className="px-2 pb-1">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Favorites</div>
                        <div className="grid grid-cols-2 gap-1">
                            {favoriteEntries.map((entry) => (
                                <PaletteItem
                                    key={entry.kind}
                                    label={entry.label}
                                    kind={entry.kind}
                                    isFavorite={true}
                                    isActive={draggingKind === entry.kind}
                                    onClick={handleClick}
                                    onToggleFavorite={toggleFavorite}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Search results */}
                {paletteSearch ? (
                    <div className="px-2">
                        <div className="grid grid-cols-2 gap-1">
                            {filtered.map((entry) => (
                                <PaletteItem
                                    key={entry.kind}
                                    label={entry.label}
                                    kind={entry.kind}
                                    isFavorite={favorites.includes(entry.kind)}
                                    isActive={draggingKind === entry.kind}
                                    onClick={handleClick}
                                    onToggleFavorite={toggleFavorite}
                                />
                            ))}
                        </div>
                        {filtered.length === 0 && <div className="py-4 text-center text-xs text-gray-400">No matches</div>}
                    </div>
                ) : (
                    /* Categories */
                    CATEGORIES.map((cat) => {
                        const entries = PALETTE_ENTRIES.filter((e) => e.category === cat.id)
                        const isExpanded = expandedCategory === cat.id
                        return (
                            <div key={cat.id} className="border-b border-gray-200">
                                <button
                                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                                >
                                    {cat.label}
                                    <span className="text-[10px]">{isExpanded ? '▾' : '▸'}</span>
                                </button>
                                {isExpanded && (
                                    <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                                        {entries.map((entry) => (
                                            <PaletteItem
                                                key={entry.kind}
                                                label={entry.label}
                                                kind={entry.kind}
                                                isFavorite={favorites.includes(entry.kind)}
                                                isActive={draggingKind === entry.kind}
                                                onClick={handleClick}
                                                onToggleFavorite={toggleFavorite}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

function PaletteItem({
    label,
    kind,
    isFavorite,
    isActive,
    onClick,
    onToggleFavorite,
}: {
    label: string
    kind: ComponentKind
    isFavorite: boolean
    isActive: boolean
    onClick: (kind: ComponentKind) => void
    onToggleFavorite: (kind: ComponentKind) => void
}) {
    return (
        <div
            className={`group relative flex cursor-pointer items-center rounded border px-2 py-1.5 text-xs text-gray-700 hover:border-blue-300 hover:bg-blue-50 ${isActive ? 'border-blue-500 bg-blue-100 ring-1 ring-blue-400' : 'border-gray-200 bg-white'}`}
            onClick={() => onClick(kind)}
        >
            <span className="truncate">{label}</span>
            <button
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavorite(kind)
                }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                {isFavorite ? '★' : '☆'}
            </button>
        </div>
    )
}
