import rough from 'roughjs'
import type { WireframeComponent } from '../types/component'

const SKETCHY_OPTIONS = {
    roughness: 1.5,
    bowing: 1,
    strokeWidth: 1.5,
    stroke: '#333',
    fill: 'transparent',
    fillStyle: 'hachure' as const,
}

export function renderSketchyComponent(svg: SVGSVGElement, component: WireframeComponent): SVGGElement {
    const rc = rough.svg(svg)
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('transform', `translate(${component.bounds.x}, ${component.bounds.y})`)
    g.setAttribute('opacity', String(component.style.opacity))

    const { width, height } = component.bounds
    const opts = {
        ...SKETCHY_OPTIONS,
        stroke: component.style.stroke,
        fill: component.style.fill === 'transparent' ? undefined : component.style.fill,
        strokeWidth: component.style.strokeWidth,
    }

    switch (component.kind) {
        case 'button': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#e8e8e8', fillStyle: 'solid' }))
            appendText(g, component.text, width / 2, height / 2, component.style, true)
            break
        }
        case 'text-field': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            appendText(g, component.placeholder || component.text, 8, height / 2, { ...component.style, textAlign: 'left' }, false, '#999')
            break
        }
        case 'textarea': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            appendText(g, component.text, 8, 18, { ...component.style, textAlign: 'left' }, false, '#999')
            break
        }
        case 'checkbox': {
            g.appendChild(rc.rectangle(0, 2, 16, 16, opts))
            g.appendChild(rc.line(3, 10, 7, 15, opts))
            g.appendChild(rc.line(7, 15, 14, 4, opts))
            appendText(g, component.text, 22, height / 2, { ...component.style, textAlign: 'left' })
            break
        }
        case 'radio': {
            g.appendChild(rc.circle(10, height / 2, 16, opts))
            g.appendChild(rc.circle(10, height / 2, 6, { ...opts, fill: '#333', fillStyle: 'solid' }))
            appendText(g, component.text, 24, height / 2, { ...component.style, textAlign: 'left' })
            break
        }
        case 'toggle': {
            g.appendChild(rc.rectangle(0, 2, width, height - 4, { ...opts, fill: '#4ade80', fillStyle: 'solid' }))
            g.appendChild(rc.circle(width - height / 2 + 2, height / 2, height - 8, { ...opts, fill: '#fff', fillStyle: 'solid' }))
            break
        }
        case 'dropdown': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            appendText(g, component.text, 8, height / 2, { ...component.style, textAlign: 'left' })
            // Arrow
            g.appendChild(rc.line(width - 20, height / 2 - 3, width - 14, height / 2 + 3, opts))
            g.appendChild(rc.line(width - 14, height / 2 + 3, width - 8, height / 2 - 3, opts))
            break
        }
        case 'heading': {
            appendText(g, component.text, width / 2, height / 2, { ...component.style, fontSize: 24, fontWeight: 700 }, true)
            break
        }
        case 'paragraph': {
            appendText(g, component.text, 0, 14, { ...component.style, textAlign: 'left' })
            break
        }
        case 'label': {
            appendText(g, component.text, 0, height / 2, { ...component.style, textAlign: 'left' })
            break
        }
        case 'image-placeholder': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            g.appendChild(rc.line(0, 0, width, height, { ...opts, strokeWidth: 0.8 }))
            g.appendChild(rc.line(width, 0, 0, height, { ...opts, strokeWidth: 0.8 }))
            appendText(g, 'Image', width / 2, height / 2, component.style, true, '#999')
            break
        }
        case 'icon': {
            g.appendChild(rc.circle(width / 2, height / 2, Math.min(width, height), opts))
            break
        }
        case 'avatar': {
            g.appendChild(rc.circle(width / 2, height / 2, Math.min(width, height), { ...opts, fill: '#ddd', fillStyle: 'solid' }))
            break
        }
        case 'badge': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#3b82f6', fillStyle: 'solid' }))
            appendText(g, component.text, width / 2, height / 2, component.style, true, '#fff')
            break
        }
        case 'container':
        case 'panel':
        case 'card': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            if (component.kind !== 'container') {
                appendText(g, component.text, 12, 20, { ...component.style, textAlign: 'left' })
            }
            break
        }
        case 'modal': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#fff', fillStyle: 'solid' }))
            g.appendChild(rc.line(0, 36, width, 36, opts))
            appendText(g, component.text, 12, 22, { ...component.style, textAlign: 'left', fontWeight: 600 })
            // Close X
            g.appendChild(rc.line(width - 24, 12, width - 12, 24, opts))
            g.appendChild(rc.line(width - 12, 12, width - 24, 24, opts))
            break
        }
        case 'tabs': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            const tabWidth = width / 3
            for (let i = 0; i < 3; i++) {
                g.appendChild(rc.rectangle(i * tabWidth, 0, tabWidth, 32, { ...opts, fill: i === 0 ? '#e8e8e8' : undefined, fillStyle: 'solid' }))
                appendText(g, `Tab ${i + 1}`, i * tabWidth + tabWidth / 2, 16, component.style, true)
            }
            break
        }
        case 'navbar': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#f5f5f5', fillStyle: 'solid' }))
            appendText(g, 'Logo', 16, height / 2, { ...component.style, textAlign: 'left', fontWeight: 700 })
            const links = ['Home', 'About', 'Contact']
            links.forEach((label, i) => {
                appendText(g, label, width - 200 + i * 70, height / 2, component.style, true)
            })
            break
        }
        case 'sidebar': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#f9f9f9', fillStyle: 'solid' }))
            const items = ['Dashboard', 'Projects', 'Settings', 'Help']
            items.forEach((label, i) => {
                appendText(g, label, 16, 30 + i * 36, { ...component.style, textAlign: 'left' })
                if (i < items.length - 1) {
                    g.appendChild(rc.line(8, 46 + i * 36, width - 8, 46 + i * 36, { ...opts, strokeWidth: 0.5 }))
                }
            })
            break
        }
        case 'breadcrumb': {
            const crumbs = ['Home', 'Section', 'Page']
            let offsetX = 0
            crumbs.forEach((label, i) => {
                appendText(g, label, offsetX, height / 2, { ...component.style, textAlign: 'left' }, false, i < crumbs.length - 1 ? '#3b82f6' : '#333')
                offsetX += label.length * 8 + 8
                if (i < crumbs.length - 1) {
                    appendText(g, '/', offsetX - 4, height / 2, { ...component.style, textAlign: 'left' }, false, '#999')
                    offsetX += 12
                }
            })
            break
        }
        case 'link': {
            appendText(g, component.text, 0, height / 2, { ...component.style, textAlign: 'left' }, false, '#3b82f6')
            // Underline
            g.appendChild(rc.line(0, height / 2 + 8, component.text.length * 7, height / 2 + 8, { ...opts, stroke: '#3b82f6', strokeWidth: 1 }))
            break
        }
        case 'table': {
            const rows = 4
            const cols = 3
            const cellW = width / cols
            const cellH = height / rows
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            // Header
            g.appendChild(rc.rectangle(0, 0, width, cellH, { ...opts, fill: '#f0f0f0', fillStyle: 'solid' }))
            for (let c = 0; c < cols; c++) {
                appendText(g, `Col ${c + 1}`, c * cellW + cellW / 2, cellH / 2, { ...component.style, fontWeight: 600 }, true)
            }
            // Grid lines
            for (let r = 1; r < rows; r++) {
                g.appendChild(rc.line(0, r * cellH, width, r * cellH, { ...opts, strokeWidth: 0.5 }))
            }
            for (let c = 1; c < cols; c++) {
                g.appendChild(rc.line(c * cellW, 0, c * cellW, height, { ...opts, strokeWidth: 0.5 }))
            }
            // Cell content
            for (let r = 1; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    appendText(g, `Cell`, c * cellW + cellW / 2, r * cellH + cellH / 2, component.style, true, '#666')
                }
            }
            break
        }
        case 'list': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            const listItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4']
            listItems.forEach((label, i) => {
                const y = 12 + i * (height / listItems.length)
                appendText(g, `• ${label}`, 12, y + 14, { ...component.style, textAlign: 'left' })
                if (i < listItems.length - 1) {
                    g.appendChild(rc.line(4, y + 28, width - 4, y + 28, { ...opts, strokeWidth: 0.3 }))
                }
            })
            break
        }
        case 'alert': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#fef3c7', fillStyle: 'solid' }))
            appendText(g, '⚠ ' + component.text, 12, height / 2, { ...component.style, textAlign: 'left' })
            break
        }
        case 'toast': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#333', fillStyle: 'solid' }))
            appendText(g, component.text, 12, height / 2, { ...component.style, textAlign: 'left' }, false, '#fff')
            break
        }
        case 'progress-bar': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#e5e7eb', fillStyle: 'solid' }))
            g.appendChild(rc.rectangle(0, 0, width * 0.6, height, { ...opts, fill: '#3b82f6', fillStyle: 'solid' }))
            break
        }
        case 'spinner': {
            g.appendChild(rc.circle(width / 2, height / 2, Math.min(width, height) - 4, { ...opts, fill: undefined }))
            g.appendChild(rc.arc(width / 2, height / 2, Math.min(width, height) - 4, Math.min(width, height) - 4, 0, Math.PI, false, opts))
            break
        }
        case 'skeleton': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#e5e7eb', fillStyle: 'solid', strokeWidth: 0 }))
            break
        }
        case 'pagination': {
            const pageCount = 5
            const btnSize = 28
            const gap = 4
            const startX = (width - pageCount * (btnSize + gap)) / 2
            for (let i = 0; i < pageCount; i++) {
                const x = startX + i * (btnSize + gap)
                g.appendChild(rc.rectangle(x, (height - btnSize) / 2, btnSize, btnSize, { ...opts, fill: i === 0 ? '#3b82f6' : undefined, fillStyle: 'solid' }))
                appendText(g, String(i + 1), x + btnSize / 2, height / 2, component.style, true, i === 0 ? '#fff' : '#333')
            }
            break
        }
        case 'slider': {
            const trackY = height / 2
            g.appendChild(rc.line(0, trackY, width, trackY, { ...opts, strokeWidth: 3 }))
            g.appendChild(rc.line(0, trackY, width * 0.4, trackY, { ...opts, stroke: '#3b82f6', strokeWidth: 3 }))
            g.appendChild(rc.circle(width * 0.4, trackY, 14, { ...opts, fill: '#fff', fillStyle: 'solid' }))
            break
        }
        case 'icon-button': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#e8e8e8', fillStyle: 'solid' }))
            g.appendChild(rc.circle(width / 2, height / 2, 12, opts))
            break
        }
        case 'menu': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#fff', fillStyle: 'solid' }))
            const menuItems = ['Action 1', 'Action 2', 'Action 3', 'Action 4']
            menuItems.forEach((label, i) => {
                const itemY = i * (height / menuItems.length)
                appendText(g, label, 12, itemY + height / menuItems.length / 2, { ...component.style, textAlign: 'left' })
                if (i < menuItems.length - 1) {
                    g.appendChild(rc.line(4, itemY + height / menuItems.length, width - 4, itemY + height / menuItems.length, { ...opts, strokeWidth: 0.3 }))
                }
            })
            break
        }
        case 'accordion': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            const sections = ['Section 1', 'Section 2', 'Section 3']
            const sectionH = height / sections.length
            sections.forEach((label, i) => {
                if (i > 0) {
                    g.appendChild(rc.line(0, i * sectionH, width, i * sectionH, opts))
                }
                appendText(g, label, 12, i * sectionH + 20, { ...component.style, textAlign: 'left', fontWeight: 600 })
                // Arrow
                const arrowX = width - 20
                const arrowY = i * sectionH + 14
                if (i === 0) {
                    g.appendChild(rc.line(arrowX, arrowY, arrowX + 8, arrowY + 6, opts))
                    g.appendChild(rc.line(arrowX + 8, arrowY + 6, arrowX + 16, arrowY, opts))
                } else {
                    g.appendChild(rc.line(arrowX, arrowY + 6, arrowX + 8, arrowY, opts))
                    g.appendChild(rc.line(arrowX + 8, arrowY, arrowX + 16, arrowY + 6, opts))
                }
            })
            break
        }
        case 'drawer': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#fff', fillStyle: 'solid' }))
            g.appendChild(rc.line(0, 48, width, 48, opts))
            appendText(g, component.text, 16, 28, { ...component.style, textAlign: 'left', fontWeight: 600 })
            // Close X
            g.appendChild(rc.line(width - 28, 16, width - 16, 32, opts))
            g.appendChild(rc.line(width - 16, 16, width - 28, 32, opts))
            break
        }
        case 'date-picker': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            appendText(g, 'mm/dd/yyyy', 8, height / 2, { ...component.style, textAlign: 'left' }, false, '#999')
            // Calendar icon
            g.appendChild(rc.rectangle(width - 30, 6, 22, 22, { ...opts, strokeWidth: 1 }))
            break
        }
        case 'file-upload': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, strokeLineDash: [6, 4] }))
            appendText(g, 'Drop files here', width / 2, height / 2 - 6, component.style, true, '#999')
            appendText(g, 'or click to browse', width / 2, height / 2 + 12, { ...component.style, fontSize: 11 }, true, '#3b82f6')
            break
        }
        case 'tooltip': {
            g.appendChild(rc.rectangle(0, 0, width, height, { ...opts, fill: '#333', fillStyle: 'solid' }))
            appendText(g, component.text, width / 2, height / 2, component.style, true, '#fff')
            break
        }
        case 'tree-view': {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            const treeItems = [
                { label: '▸ Folder 1', indent: 0 },
                { label: '  File 1.1', indent: 1 },
                { label: '  File 1.2', indent: 1 },
                { label: '▸ Folder 2', indent: 0 },
                { label: '  File 2.1', indent: 1 },
            ]
            treeItems.forEach((item, i) => {
                appendText(g, item.label, 12 + item.indent * 16, 18 + i * 24, { ...component.style, textAlign: 'left', fontSize: 12 })
            })
            break
        }
        default: {
            g.appendChild(rc.rectangle(0, 0, width, height, opts))
            appendText(g, component.text, width / 2, height / 2, component.style, true)
        }
    }

    return g
}

function appendText(
    g: SVGGElement,
    text: string,
    x: number,
    y: number,
    style: { fontSize: number; fontWeight: number; textAlign: string },
    centered = false,
    color = '#333',
): void {
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    textEl.setAttribute('x', String(x))
    textEl.setAttribute('y', String(y))
    textEl.setAttribute('font-family', "'Caveat', 'Comic Neue', cursive")
    textEl.setAttribute('font-size', String(style.fontSize))
    textEl.setAttribute('font-weight', String(style.fontWeight))
    textEl.setAttribute('fill', color)
    if (centered) {
        textEl.setAttribute('text-anchor', 'middle')
        textEl.setAttribute('dominant-baseline', 'central')
    } else {
        textEl.setAttribute('dominant-baseline', 'central')
    }
    textEl.textContent = text
    g.appendChild(textEl)
}
