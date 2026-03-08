import type { ComponentId, HotspotId, PageId, ProjectId } from '../types/component'

let counter = 0

function generateId(): string {
    return `${Date.now()}-${++counter}-${Math.random().toString(36).slice(2, 8)}`
}

export function createComponentId(): ComponentId {
    return generateId() as ComponentId
}

export function createPageId(): PageId {
    return generateId() as PageId
}

export function createProjectId(): ProjectId {
    return generateId() as ProjectId
}

export function createHotspotId(): HotspotId {
    return generateId() as HotspotId
}
