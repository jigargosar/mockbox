import type { PaletteEntry } from './component'

export const PALETTE_ENTRIES: readonly PaletteEntry[] = [
    // Layout
    { kind: 'container', category: 'layout', label: 'Container', defaultSize: { width: 300, height: 200 } },
    { kind: 'panel', category: 'layout', label: 'Panel', defaultSize: { width: 280, height: 180 } },
    { kind: 'tabs', category: 'layout', label: 'Tabs', defaultSize: { width: 300, height: 200 } },
    { kind: 'accordion', category: 'layout', label: 'Accordion', defaultSize: { width: 280, height: 160 } },
    { kind: 'modal', category: 'layout', label: 'Modal', defaultSize: { width: 400, height: 300 } },
    { kind: 'drawer', category: 'layout', label: 'Drawer', defaultSize: { width: 300, height: 400 } },

    // Input
    { kind: 'text-field', category: 'input', label: 'Text Field', defaultSize: { width: 200, height: 36 } },
    { kind: 'textarea', category: 'input', label: 'Text Area', defaultSize: { width: 200, height: 80 } },
    { kind: 'checkbox', category: 'input', label: 'Checkbox', defaultSize: { width: 120, height: 24 } },
    { kind: 'radio', category: 'input', label: 'Radio', defaultSize: { width: 120, height: 24 } },
    { kind: 'toggle', category: 'input', label: 'Toggle', defaultSize: { width: 48, height: 24 } },
    { kind: 'dropdown', category: 'input', label: 'Dropdown', defaultSize: { width: 200, height: 36 } },
    { kind: 'slider', category: 'input', label: 'Slider', defaultSize: { width: 200, height: 24 } },
    { kind: 'date-picker', category: 'input', label: 'Date Picker', defaultSize: { width: 200, height: 36 } },
    { kind: 'file-upload', category: 'input', label: 'File Upload', defaultSize: { width: 200, height: 80 } },

    // Display
    { kind: 'heading', category: 'display', label: 'Heading', defaultSize: { width: 200, height: 40 } },
    { kind: 'paragraph', category: 'display', label: 'Paragraph', defaultSize: { width: 300, height: 60 } },
    { kind: 'label', category: 'display', label: 'Label', defaultSize: { width: 100, height: 24 } },
    { kind: 'image-placeholder', category: 'display', label: 'Image', defaultSize: { width: 200, height: 150 } },
    { kind: 'icon', category: 'display', label: 'Icon', defaultSize: { width: 24, height: 24 } },
    { kind: 'avatar', category: 'display', label: 'Avatar', defaultSize: { width: 40, height: 40 } },
    { kind: 'badge', category: 'display', label: 'Badge', defaultSize: { width: 60, height: 24 } },
    { kind: 'tooltip', category: 'display', label: 'Tooltip', defaultSize: { width: 160, height: 40 } },

    // Navigation
    { kind: 'navbar', category: 'navigation', label: 'Navbar', defaultSize: { width: 600, height: 48 } },
    { kind: 'sidebar', category: 'navigation', label: 'Sidebar', defaultSize: { width: 240, height: 400 } },
    { kind: 'breadcrumb', category: 'navigation', label: 'Breadcrumb', defaultSize: { width: 300, height: 24 } },
    { kind: 'pagination', category: 'navigation', label: 'Pagination', defaultSize: { width: 300, height: 36 } },
    { kind: 'link', category: 'navigation', label: 'Link', defaultSize: { width: 80, height: 24 } },
    { kind: 'menu', category: 'navigation', label: 'Menu', defaultSize: { width: 180, height: 200 } },

    // Action
    { kind: 'button', category: 'action', label: 'Button', defaultSize: { width: 120, height: 36 } },
    { kind: 'icon-button', category: 'action', label: 'Icon Button', defaultSize: { width: 36, height: 36 } },

    // Data
    { kind: 'table', category: 'data', label: 'Table', defaultSize: { width: 400, height: 200 } },
    { kind: 'list', category: 'data', label: 'List', defaultSize: { width: 240, height: 200 } },
    { kind: 'card', category: 'data', label: 'Card', defaultSize: { width: 240, height: 160 } },
    { kind: 'tree-view', category: 'data', label: 'Tree View', defaultSize: { width: 220, height: 200 } },

    // Feedback
    { kind: 'alert', category: 'feedback', label: 'Alert', defaultSize: { width: 300, height: 48 } },
    { kind: 'toast', category: 'feedback', label: 'Toast', defaultSize: { width: 280, height: 48 } },
    { kind: 'progress-bar', category: 'feedback', label: 'Progress Bar', defaultSize: { width: 200, height: 12 } },
    { kind: 'spinner', category: 'feedback', label: 'Spinner', defaultSize: { width: 32, height: 32 } },
    { kind: 'skeleton', category: 'feedback', label: 'Skeleton', defaultSize: { width: 200, height: 20 } },
]

export const CATEGORIES = [
    { id: 'layout' as const, label: 'Layout' },
    { id: 'input' as const, label: 'Input' },
    { id: 'display' as const, label: 'Display' },
    { id: 'navigation' as const, label: 'Navigation' },
    { id: 'action' as const, label: 'Action' },
    { id: 'data' as const, label: 'Data' },
    { id: 'feedback' as const, label: 'Feedback' },
]
