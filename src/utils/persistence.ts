import type { Project } from '../types/component'

const STORAGE_KEY = 'mockbox-projects'
const CURRENT_PROJECT_KEY = 'mockbox-current-project'

export function saveProject(project: Project): void {
    const projects = loadAllProjects()
    const index = projects.findIndex((p) => p.id === project.id)
    const updated = { ...project, updatedAt: Date.now() }
    if (index >= 0) {
        projects[index] = updated
    } else {
        projects.push(updated)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    localStorage.setItem(CURRENT_PROJECT_KEY, project.id)
}

export function loadAllProjects(): Project[] {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Project[]
}

export function loadCurrentProjectId(): string | null {
    return localStorage.getItem(CURRENT_PROJECT_KEY)
}

export function deleteProject(projectId: string): void {
    const projects = loadAllProjects().filter((p) => p.id !== projectId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function exportProject(project: Project): string {
    return JSON.stringify(project, null, 2)
}

export function importProject(json: string): Project {
    return JSON.parse(json) as Project
}
