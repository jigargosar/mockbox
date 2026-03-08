import type { WireframeComponent } from '../types/component'

export function renderCleanComponent(component: WireframeComponent): SVGGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('transform', `translate(${component.bounds.x}, ${component.bounds.y})`)
    g.setAttribute('opacity', String(component.style.opacity))

    const { width, height } = component.bounds

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', String(width))
    rect.setAttribute('height', String(height))
    rect.setAttribute('rx', String(component.style.cornerRadius))
    rect.setAttribute('fill', component.style.fill === 'transparent' ? 'none' : component.style.fill)
    rect.setAttribute('stroke', component.style.stroke)
    rect.setAttribute('stroke-width', String(component.style.strokeWidth))
    g.appendChild(rect)

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', String(width / 2))
    text.setAttribute('y', String(height / 2))
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'central')
    text.setAttribute('font-family', 'Inter, system-ui, sans-serif')
    text.setAttribute('font-size', String(component.style.fontSize))
    text.setAttribute('font-weight', String(component.style.fontWeight))
    text.setAttribute('fill', '#333')
    text.textContent = component.text
    g.appendChild(text)

    return g
}
