# MockBox — Master Plan

A local-first, browser-based wireframing tool with hand-drawn aesthetics, multi-page support, and interactive prototyping.

---

## Implementation Procedure

The build follows a **bottom-up, dependency-driven** order across 10 phases. Each phase produces a shippable increment that can be tested in isolation before the next phase begins.

| Principle | Detail |
|---|---|
| **Dependency order** | Every feature lands only after the features it depends on are stable. Snap-to-grid can't exist before drag-to-place; alignment guides can't fire without a selection model. |
| **Vertical slices** | Each phase delivers end-to-end functionality, not just plumbing. Phase 1 ends with a pannable, zoomable canvas that already renders in the sketchy style — not a blank div. |
| **State architecture first** | A single, immutable-friendly document model (pages → layers → components) is defined in Phase 1 and never restructured. Every later feature is a function over that model. |
| **Command pattern from day one** | All mutations go through a command bus starting in Phase 3. This makes undo/redo (Phase 6) a replay concern rather than a retrofit. |
| **Test at the boundary** | Each phase includes integration-level tests for its user-facing behaviour (canvas gestures, keyboard shortcuts, export output) rather than unit tests on internals. |

---

## Phase 1 — Canvas Foundation & Rendering Engine

Set up the spatial surface everything else lives on, and establish the visual identity.

| # | Feature | Notes |
|---|---|---|
| 1 | Infinite canvas — pan (middle-click / space+drag) and zoom (scroll wheel / pinch) | Core coordinate system. Implement a camera transform (translate + scale) applied to a single canvas/SVG layer. All future hit-testing and rendering flows through this transform. |
| 14 | Hand-drawn sketchy line rendering (Rough.js or similar) | Integrate immediately so every subsequent component renders in the house style from the start. Avoids a late-stage rendering swap. |
| 15 | Wireframe colour palette (greyscale + blue accent for links) | Define as a theme token set. Every component pulls colours from this palette, never from hard-coded values. |
| 16 | Handwriting-style font for text | Load a single variable-weight hand-drawn font (e.g. Virgil, Excalifont). All text components inherit it by default. |
| 41 | Rulers along top and left edges | Render as a fixed overlay outside the camera transform. Tick marks update as zoom changes. Needed before grid lines so users can reason about distances. |
| 4 | Configurable grid (display only at this point) | Draw grid dots/lines inside the camera layer. Grid size stored in project settings. Snap behaviour arrives in Phase 3 once components can be placed. |

**Exit criteria:** A blank canvas that pans/zooms smoothly, shows rulers and a grid, and renders a hard-coded test rectangle in the sketchy style.

---

## Phase 2 — Component Palette & Placement

Give users things to put on the canvas.

| # | Feature | Notes |
|---|---|---|
| 2 | Sidebar component palette organised by category | Categories: Layout (frame, divider, spacer), Text (heading, paragraph, label), Input (text field, textarea, checkbox, radio, toggle, dropdown, slider), Buttons, Media (image placeholder, icon, avatar), Navigation (navbar, tab bar, breadcrumb, link), Feedback (toast, modal, tooltip). Each component is a factory function returning a default-sized instance. |
| 3 | Drag from palette onto canvas to place | On drag-start, create a ghost preview at cursor. On drop inside canvas bounds, instantiate the component at the snapped position. This is the first mutation — route it through the command bus. |
| 4 | **Snap-to-grid** (activation) | Now that components can be placed, enable positional snapping. Nearest grid intersection within a threshold wins. Hold Alt to temporarily disable snap. |
| 26 | Search / filter within palette | Simple substring match over component names and category tags. Filter updates the visible list in real time. |
| 27 | Favourites for frequently used components | Star toggle persisted in user prefs (localStorage). Favourites float to the top or get their own section. |

**Exit criteria:** Users can browse, search, and drag components onto the canvas. Placed components snap to the grid and render in the sketchy style.

---

## Phase 3 — Selection & Spatial Manipulation

Enable selecting and moving what's on the canvas.

| # | Feature | Notes |
|---|---|---|
| 5 | Click to select · Shift+click multi-select · Drag to marquee-select | Build a selection model (Set of component IDs). Marquee uses intersection test against component bounding boxes in world coordinates. |
| 6 | Move selected via drag or arrow keys (Shift+arrow = 10× step) | Drag applies a delta to all selected components. Arrow keys use grid-size as the base step. Route through command bus for undo. |
| 7 | Resize via corner/edge handles · Shift to lock aspect ratio | Eight handles per selected component. During drag, clamp to minimum size and optionally snap to grid. |
| 8 | Duplicate (Ctrl+D) · Delete (Del / Backspace) | Duplicate deep-clones selected components with a small offset. Delete removes from document model. Both are undoable commands. |
| 19 | Smart alignment guides (snap to edges / centres of nearby components) | On move/resize, scan nearby components and emit guide lines when edges or centres align within a threshold. Takes priority over grid snap when active. |

**Exit criteria:** Full direct-manipulation loop — select, move, resize, duplicate, delete — with visual guides assisting alignment.

---

## Phase 4 — Property Panel

Let users fine-tune components without code.

| # | Feature | Notes |
|---|---|---|
| 9 | Context-sensitive property panel (right sidebar) | Panel content swaps based on the type(s) of the current selection. Multi-select shows only shared properties. Empty selection shows canvas/page settings. |
| 10 | Dimensions — x, y, width, height (numeric inputs) | Two-way bound: dragging on canvas updates the panel; editing numbers updates the canvas. Validate min/max. |
| 11 | Typography — font size, weight, alignment | Applies to text-bearing components. Expose a constrained set of sizes and weights that look good in the handwriting font. |
| 12 | Content editing — text, placeholder, options list (for dropdowns / radios) | Double-click a text component to enter inline editing mode. Property panel offers the same fields for non-inline editing. Options stored as a simple string array. |
| 13 | Style overrides — fill, border, corner radius, opacity | Overrides layer on top of theme defaults. Expose a colour picker limited to the wireframe palette (Phase 1) plus an "accent" swatch. |

**Exit criteria:** Every visual property of every component type is editable through the panel, and changes are reflected instantly on the canvas.

---

## Phase 5 — Layers & Spatial Organisation

Give users control over z-order and logical grouping.

| # | Feature | Notes |
|---|---|---|
| 20 | Layers panel showing z-order of all components on current page | A flat list sorted by z-index. Selecting in the panel selects on canvas and vice versa. |
| 21 | Drag to reorder layers · Toggle visibility · Toggle lock | Reorder mutates z-index of affected components. Hidden components skip rendering. Locked components reject selection and move commands. |
| 23 | Name layers for clarity | Auto-generate a name from component type + index. Allow user rename via double-click in layers panel. |
| 24 | Lock / unlock components to prevent accidental edits | Lock state stored per-component. Locked components render with a subtle badge and ignore pointer events. |
| 22 | Group / ungroup (Ctrl+G / Ctrl+Shift+G) | A group is a lightweight container component. Selecting any child selects the group; double-click enters the group for child-level selection. Groups appear as collapsible rows in the layers panel. |

**Exit criteria:** Users can name, reorder, lock, hide, group, and ungroup components. The layers panel stays in sync with every canvas operation.

---

## Phase 6 — Undo / Redo & Clipboard

Formalise the command history and clipboard.

| # | Feature | Notes |
|---|---|---|
| 17 | Unlimited undo / redo (Ctrl+Z / Ctrl+Shift+Z) — command-based history stack | Every mutation since Phase 2 has been routed through the command bus. Now expose the stack as an undoable/redoable list. Each command stores a forward and inverse patch (or full before/after snapshots for safety). |
| 39 | History panel showing named actions | A sidebar/drawer listing the stack. Click an entry to jump to that state (batch undo/redo). Each command carries a human-readable label (e.g. "Move Button", "Delete 3 components"). |
| 18 | Copy / paste (Ctrl+C / Ctrl+V) | Serialise selected components to an internal clipboard (JSON). Paste deserialises with new IDs and an offset. Also supports paste-in-place (Ctrl+Shift+V). |

**Exit criteria:** Users can freely undo, redo, and review history. Copy/paste works within and across selections.

---

## Phase 7 — Multi-Page & Prototyping

Expand from single-page to multi-page interactive prototypes.

| # | Feature | Notes |
|---|---|---|
| 28 | Page list sidebar — add, rename, reorder, duplicate, delete pages | Document model already supports a pages array. This phase adds the UI and page-switching logic. Active page swaps the rendered component tree. |
| 29 | Copy / paste across pages | Extend clipboard to carry page-context. Paste into a different page adjusts nothing — positions are page-local. |
| 30 | Hotspot links — draw link regions that navigate to other pages on click | A hotspot is a transparent rectangle component with a `targetPageId` property. Rendered with a translucent blue overlay in edit mode, invisible in presentation mode. |
| 31 | Presentation mode — click through linked pages as interactive prototype | Full-screen overlay. Hides all chrome. Click on hotspots to navigate. Esc or close button returns to editor. Optionally show a page-transition animation. |

**Exit criteria:** Users can build multi-screen flows and walk through them in presentation mode.

---

## Phase 8 — Persistence & Export

Save work and get assets out.

| # | Feature | Notes |
|---|---|---|
| 32 | Auto-save to IndexedDB (local-first, no server) | Debounced save on every command commit (300 ms). Store the full document model keyed by project ID. Use a versioned schema so future migrations are painless. |
| 33 | Manual export / import as `.mockbox` JSON file | `.mockbox` is the document model serialised to JSON with a version header. Import validates schema before loading. |
| 34 | Recent projects list on home screen | Home screen reads project metadata (name, thumbnail, last-modified) from IndexedDB. Click to open, long-press/right-click for rename/delete. |
| 35 | Export current page or all pages as PNG | Render the canvas layer(s) to an offscreen canvas at the chosen resolution, then `toBlob()`. All-pages export produces a ZIP. |
| 36 | Export as PDF (multi-page document) | Use jsPDF or a similar client-side lib. One PDF page per project page. Respect page dimensions set in project settings. |
| 37 | Export as SVG | Serialise the Rough.js output (already SVG paths) into a standalone SVG file. One file per page or combined. |
| 38 | Copy selection as image to clipboard | Render selected components to an offscreen canvas, then `navigator.clipboard.write()` with a `ClipboardItem` containing the PNG blob. |

**Exit criteria:** Projects persist across sessions, can be shared as `.mockbox` files, and can be exported as PNG, PDF, or SVG.

---

## Phase 9 — Component States & Rendering Modes

Add fidelity controls.

| # | Feature | Notes |
|---|---|---|
| 25 | Component state — default, hover, disabled, active, focused | Each component stores a map of state → style overrides. The property panel shows a state switcher. In presentation mode, states respond to actual pointer events. |
| 40 | Toggle between sketchy and clean rendering modes | "Clean" mode bypasses Rough.js and renders with standard strokes and fills. A single toggle in the toolbar swaps the renderer. Useful for higher-fidelity reviews without leaving the tool. |
| 42 | Minimap for orientation on large canvases | A small fixed-position rectangle in the corner showing a downscaled render of all components. The viewport is indicated as a draggable highlight. |

**Exit criteria:** Components respond to state changes in presentation mode. Users can toggle visual fidelity and navigate large canvases via the minimap.

---

## Phase 10 — Keyboard Accessibility & Final Polish

Make the tool usable for everyone and tighten the shortcut system.

| # | Feature | Notes |
|---|---|---|
| 43 | Comprehensive keyboard shortcut system | Centralise all shortcuts in a registry. Support single keys, chords, and sequences. Prevent conflicts. Allow future remapping. |
| 44 | Shortcut cheatsheet overlay (Ctrl+/) | Modal overlay listing all shortcuts grouped by category. Searchable. |
| 45 | All canvas operations accessible via keyboard | Audit every mouse-only interaction and ensure a keyboard equivalent exists (e.g. Tab to cycle selection, Enter to confirm placement). |
| 46 | Screen reader announcements for selection changes | Use ARIA live regions to announce "Selected Button 'Submit'", "3 components selected", "Moved to page 2", etc. |
| 47 | High-contrast mode option | Swap the wireframe palette for a WCAG-AAA-compliant high-contrast palette. Store preference in user settings. |

**Exit criteria:** Every feature is operable via keyboard. Screen reader users receive meaningful feedback. The shortcut system is complete and documented.

---

## Cross-Cutting Concerns (all phases)

These are not features with their own phase — they're engineering practices woven through every phase.

| Concern | Approach |
|---|---|
| **Document model** | Single source of truth: `Project → Page[] → Layer[] → Component[]`. Defined in Phase 1, extended (never restructured) in later phases. |
| **Command bus** | Every state mutation is a `Command { execute(), undo(), label }`. Introduced in Phase 2, consumed by undo/redo in Phase 6. |
| **Rendering pipeline** | Components declare a `render(ctx, style, rough)` method. The canvas loop iterates the active page's layers in z-order. Sketchy vs. clean is a renderer swap, not a component concern. |
| **Serialisation** | The document model is always JSON-serialisable. Auto-save (Phase 8) and export reuse the same serialiser. |
| **Performance** | Spatial index (quadtree or R-tree) for hit-testing and guide computation. Only re-render dirty regions. Debounce expensive operations (auto-save, minimap). |
| **Testing** | Integration tests per phase covering user-facing behaviour. Playwright for canvas gesture tests. Snapshot tests for export formats. |

---

## Feature Index

Quick-reference mapping from original feature number to its phase.

| Original # | Feature (short name) | Phase |
|---|---|---|
| 1 | Infinite canvas + pan/zoom | 1 |
| 2 | Component palette | 2 |
| 3 | Drag to place | 2 |
| 4 | Snap-to-grid | 1 (display) · 2 (snap) |
| 5 | Select / multi-select / marquee | 3 |
| 6 | Move (drag + arrow keys) | 3 |
| 7 | Resize handles + aspect lock | 3 |
| 8 | Duplicate + delete | 3 |
| 9 | Property panel | 4 |
| 10 | Dimension inputs | 4 |
| 11 | Typography controls | 4 |
| 12 | Content editing | 4 |
| 13 | Style overrides | 4 |
| 14 | Sketchy rendering | 1 |
| 15 | Wireframe palette | 1 |
| 16 | Handwriting font | 1 |
| 17 | Undo / redo | 6 |
| 18 | Copy / paste | 6 |
| 19 | Alignment guides | 3 |
| 20 | Layers panel | 5 |
| 21 | Reorder / visibility / lock layers | 5 |
| 22 | Group / ungroup | 5 |
| 23 | Name layers | 5 |
| 24 | Lock / unlock | 5 |
| 25 | Component states | 9 |
| 26 | Palette search / filter | 2 |
| 27 | Palette favourites | 2 |
| 28 | Page list | 7 |
| 29 | Cross-page copy/paste | 7 |
| 30 | Hotspot links | 7 |
| 31 | Presentation mode | 7 |
| 32 | Auto-save (IndexedDB) | 8 |
| 33 | Export / import .mockbox | 8 |
| 34 | Recent projects | 8 |
| 35 | Export PNG | 8 |
| 36 | Export PDF | 8 |
| 37 | Export SVG | 8 |
| 38 | Copy selection as image | 8 |
| 39 | History panel | 6 |
| 40 | Sketchy ↔ clean toggle | 9 |
| 41 | Rulers | 1 |
| 42 | Minimap | 9 |
| 43 | Keyboard shortcut system | 10 |
| 44 | Shortcut cheatsheet | 10 |
| 45 | Full keyboard operability | 10 |
| 46 | Screen reader announcements | 10 |
| 47 | High-contrast mode | 10 |
