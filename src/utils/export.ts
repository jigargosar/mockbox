import { jsPDF } from 'jspdf'
import type { Page, Project, RenderMode, WireframeComponent } from '../types/component'
import { renderSketchyComponent } from '../renderers/sketchy'
import { renderCleanComponent } from '../renderers/clean'

type PageBounds = {
    readonly minX: number
    readonly minY: number
    readonly maxX: number
    readonly maxY: number
}

const PDF_PADDING = 40

function computePageBounds(components: readonly WireframeComponent[]): PageBounds | null {
    const visible = components.filter((c) => c.visible)
    if (visible.length === 0) return null

    const minX = Math.min(...visible.map((c) => c.bounds.x))
    const minY = Math.min(...visible.map((c) => c.bounds.y))
    const maxX = Math.max(...visible.map((c) => c.bounds.x + c.bounds.width))
    const maxY = Math.max(...visible.map((c) => c.bounds.y + c.bounds.height))

    return { minX, minY, maxX, maxY }
}

function buildOffscreenSvg(page: Page, renderMode: RenderMode): SVGSVGElement | null {
    const bounds = computePageBounds(page.components)
    if (!bounds) return null

    const contentWidth = bounds.maxX - bounds.minX + PDF_PADDING * 2
    const contentHeight = bounds.maxY - bounds.minY + PDF_PADDING * 2

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('width', String(contentWidth))
    svg.setAttribute('height', String(contentHeight))
    svg.setAttribute('viewBox', `0 0 ${contentWidth} ${contentHeight}`)

    // White background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('width', String(contentWidth))
    bg.setAttribute('height', String(contentHeight))
    bg.setAttribute('fill', '#ffffff')
    svg.appendChild(bg)

    // Offset group so content starts at (padding, padding)
    const offsetG = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    offsetG.setAttribute('transform', `translate(${PDF_PADDING - bounds.minX}, ${PDF_PADDING - bounds.minY})`)
    svg.appendChild(offsetG)

    const sorted = [...page.components].filter((c) => c.visible).sort((a, b) => a.zIndex - b.zIndex)

    for (const component of sorted) {
        const g = renderMode === 'sketchy' ? renderSketchyComponent(svg, component) : renderCleanComponent(component)
        offsetG.appendChild(g)
    }

    return svg
}

function svgToCanvas(svg: SVGSVGElement): Promise<HTMLCanvasElement> {
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const width = parseInt(svg.getAttribute('width') ?? '0', 10)
    const height = parseInt(svg.getAttribute('height') ?? '0', 10)

    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = width * 2
            canvas.height = height * 2
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                URL.revokeObjectURL(url)
                reject(new Error('Failed to get canvas 2d context'))
                return
            }
            ctx.scale(2, 2)
            ctx.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)
            resolve(canvas)
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load SVG as image'))
        }
        img.src = url
    })
}

export async function exportProjectAsPdf(project: Project, renderMode: RenderMode): Promise<void> {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px' })
    let isFirstPage = true

    for (const page of project.pages) {
        const svg = buildOffscreenSvg(page, renderMode)
        if (!svg) continue

        const canvas = await svgToCanvas(svg)
        const imgData = canvas.toDataURL('image/png')

        const pdfPageWidth = pdf.internal.pageSize.getWidth()
        const pdfPageHeight = pdf.internal.pageSize.getHeight()

        const canvasWidth = canvas.width / 2
        const canvasHeight = canvas.height / 2

        // Scale to fit PDF page while preserving aspect ratio
        const scaleX = pdfPageWidth / canvasWidth
        const scaleY = pdfPageHeight / canvasHeight
        const scale = Math.min(scaleX, scaleY, 1) // Don't upscale

        const imgWidth = canvasWidth * scale
        const imgHeight = canvasHeight * scale
        const offsetX = (pdfPageWidth - imgWidth) / 2
        const offsetY = (pdfPageHeight - imgHeight) / 2

        if (!isFirstPage) {
            pdf.addPage()
        }
        isFirstPage = false

        pdf.addImage(imgData, 'PNG', offsetX, offsetY, imgWidth, imgHeight)
    }

    if (isFirstPage) return // No pages had visible components

    pdf.save(`${project.name}.pdf`)
}

export async function exportPageAsPng(svgElement: SVGSVGElement, page: Page): Promise<void> {
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = svgElement.clientWidth * 2
        canvas.height = svgElement.clientHeight * 2
        const ctx = canvas.getContext('2d')!
        ctx.scale(2, 2)
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)

        canvas.toBlob((pngBlob) => {
            if (!pngBlob) return
            const a = document.createElement('a')
            a.href = URL.createObjectURL(pngBlob)
            a.download = `${page.name}.png`
            a.click()
            URL.revokeObjectURL(a.href)
        })
    }
    img.src = url
}

export function exportPageAsSvg(svgElement: SVGSVGElement, page: Page): void {
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${page.name}.svg`
    a.click()
    URL.revokeObjectURL(a.href)
}

export async function copySelectionAsImage(svgElement: SVGSVGElement): Promise<void> {
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = svgElement.clientWidth * 2
        canvas.height = svgElement.clientHeight * 2
        const ctx = canvas.getContext('2d')!
        ctx.scale(2, 2)
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)

        canvas.toBlob(async (pngBlob) => {
            if (!pngBlob) return
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
        })
    }
    img.src = url
}
