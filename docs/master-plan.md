Mockbox — Master Plan

Balsamiq-style wireframe mock builder. Sketchy, hand-drawn aesthetic. Fast, keyboard-driven, runs entirely in-browser.

+-----+==============================================================+============+
| #   | Feature                                                      | Status     |
+-----+==============================================================+============+
| 1   | Infinite canvas with pan (middle/space+drag) and zoom        | done       |
+-----+--------------------------------------------------------------+------------+
| 2   | Hand-drawn sketchy line rendering (roughjs)                  | done       |
+-----+--------------------------------------------------------------+------------+
| 3   | Wireframe color palette (grayscale + blue accent)            | partial    |
+-----+--------------------------------------------------------------+------------+
| 4   | Handwriting font for text                                    | partial    |
+-----+--------------------------------------------------------------+------------+
| 5   | Sidebar component palette organized by category              | done       |
+-----+--------------------------------------------------------------+------------+
| 6   | Place from palette onto canvas                               | done       |
|     | (click-to-activate, not drag)                                |            |
+-----+--------------------------------------------------------------+------------+
| 7   | Snap-to-grid with configurable grid size                     | done       |
+-----+--------------------------------------------------------------+------------+
| 8   | Click to select, shift+click multi-select, marquee select    | done       |
+-----+--------------------------------------------------------------+------------+
| 9   | Move selected via drag or arrow keys (shift+arrow 10x)       | done       |
+-----+--------------------------------------------------------------+------------+
| 10  | Resize via handles with aspect ratio lock (shift)            | done       |
+-----+--------------------------------------------------------------+------------+
| 11  | Duplicate (Ctrl+D), delete (Del/Backspace)                   | done       |
+-----+--------------------------------------------------------------+------------+
| 12  | Context-sensitive property panel for selected component      | done       |
+-----+--------------------------------------------------------------+------------+
| 13  | Dimensions — x, y, width, height (numeric input)             | done       |
+-----+--------------------------------------------------------------+------------+
| 14  | Typography — font size, weight, alignment                    | done       |
+-----+--------------------------------------------------------------+------------+
| 15  | Content editing — text, placeholder, options                 | partial    |
|     | (property panel only, no inline canvas editing)              |            |
+-----+--------------------------------------------------------------+------------+
| 16  | Style overrides — fill, border, corner radius, opacity       | done       |
+-----+--------------------------------------------------------------+------------+
| 17  | Unlimited undo/redo (Ctrl+Z / Ctrl+Shift+Z)                 | done       |
+-----+--------------------------------------------------------------+------------+
| 18  | Copy/paste (Ctrl+C/V)                                        | done       |
+-----+--------------------------------------------------------------+------------+
| 19  | History panel showing named actions (clickable)              | done       |
+-----+--------------------------------------------------------------+------------+
| 20  | Layers panel showing z-order with group nesting              | done       |
+-----+--------------------------------------------------------------+------------+
| 21  | Drag to reorder layers, toggle visibility, toggle lock       | done       |
+-----+--------------------------------------------------------------+------------+
| 22  | Group/ungroup (Ctrl+G / Ctrl+Shift+G) — select/move as unit | done       |
+-----+--------------------------------------------------------------+------------+
| 23  | Name layers for clarity                                      | done       |
+-----+--------------------------------------------------------------+------------+
| 24  | Lock/unlock components (visual indicator + toast feedback)   | done       |
+-----+--------------------------------------------------------------+------------+
| 25  | Smart alignment guides (snap to nearby components)           | not started|
+-----+--------------------------------------------------------------+------------+
| 26  | Rulers along top and left edges                              | done       |
+-----+--------------------------------------------------------------+------------+
| 27  | Minimap for orientation                                      | done       |
+-----+--------------------------------------------------------------+------------+
| 28  | Page list sidebar — add, rename, duplicate, delete, switch   | done       |
+-----+--------------------------------------------------------------+------------+
| 29  | Copy/paste across pages                                      | partial    |
|     | (clipboard persists across page switches)                    |            |
+-----+--------------------------------------------------------------+------------+
| 30  | Hotspot links — draw regions linking to other pages          | done       |
+-----+--------------------------------------------------------------+------------+
| 31  | Presentation mode — hotspot click nav + arrow key nav        | done       |
+-----+--------------------------------------------------------------+------------+
| 32  | Auto-save (localStorage, not IndexedDB yet)                 | partial    |
+-----+--------------------------------------------------------------+------------+
| 33  | Manual export/import as .mockbox JSON file                   | done       |
+-----+--------------------------------------------------------------+------------+
| 34  | Recent projects list on home screen                          | not started|
+-----+--------------------------------------------------------------+------------+
| 35  | Export current page or all pages as PNG                       | not started|
+-----+--------------------------------------------------------------+------------+
| 36  | Export as PDF (multi-page document)                          | done       |
+-----+--------------------------------------------------------------+------------+
| 37  | Export as SVG                                                | not started|
+-----+--------------------------------------------------------------+------------+
| 38  | Copy selection as image to clipboard                         | not started|
+-----+--------------------------------------------------------------+------------+
| 39  | Component state — default, hover, disabled, active, focused  | partial    |
|     | (metadata stored, no visual effect on canvas)                |            |
+-----+--------------------------------------------------------------+------------+
| 40  | Search/filter within palette                                 | done       |
+-----+--------------------------------------------------------------+------------+
| 41  | Favorites for frequently used components                     | done       |
+-----+--------------------------------------------------------------+------------+
| 42  | Toggle between sketchy and clean rendering modes             | done       |
+-----+--------------------------------------------------------------+------------+
| 43  | Comprehensive keyboard shortcut system                       | done       |
+-----+--------------------------------------------------------------+------------+
| 44  | Shortcut cheatsheet overlay                                  | done       |
+-----+--------------------------------------------------------------+------------+
| 45  | All canvas operations accessible via keyboard                | partial    |
|     | (Tab cycling, z-order shortcuts added)                       |            |
+-----+--------------------------------------------------------------+------------+
| 46  | Screen reader announcements for selection changes            | not started|
+-----+--------------------------------------------------------------+------------+
| 47  | High contrast mode option                                    | not started|
+-----+--------------------------------------------------------------+------------+

UX additions (not in original plan):

+-----+==============================================================+
| #   | Feature                                                      |
+-----+==============================================================+
| U1  | Toast notification system (copy/paste/export/import/errors)  |
+-----+--------------------------------------------------------------+
| U2  | Smart cursor (default/crosshair/grab/grabbing per context)   |
+-----+--------------------------------------------------------------+
| U3  | Hover outline on components                                  |
+-----+--------------------------------------------------------------+
| U4  | Placement preview ghost on canvas                            |
+-----+--------------------------------------------------------------+
| U5  | Right-click context menu (cut/copy/paste/z-order)            |
+-----+--------------------------------------------------------------+
| U6  | Bounds-based hit testing (full bounding box clickable)       |
+-----+--------------------------------------------------------------+
| U7  | Multi-select bounding box                                    |
+-----+--------------------------------------------------------------+
| U8  | Group bounding box (purple dashed outline)                   |
+-----+--------------------------------------------------------------+
| U9  | Deferred multi-select (preserves drag on multi-selection)    |
+-----+--------------------------------------------------------------+
| U10 | Marquee intersection mode (not containment-only)             |
+-----+--------------------------------------------------------------+
| U11 | Expanded resize handle hit areas (20px invisible zone)       |
+-----+--------------------------------------------------------------+
| U12 | Invisible component hit areas (full bounds, not just stroke) |
+-----+--------------------------------------------------------------+
