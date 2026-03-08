export type ComponentId = string & { readonly __brand: unique symbol }
export type PageId = string & { readonly __brand: unique symbol }
export type ProjectId = string & { readonly __brand: unique symbol }
export type HotspotId = string & { readonly __brand: unique symbol }

export type Point = { readonly x: number; readonly y: number }
export type Size = { readonly width: number; readonly height: number }
export type Bounds = Point & Size

export type ComponentCategory = 'layout' | 'input' | 'display' | 'navigation' | 'action' | 'data' | 'feedback'

export type ComponentKind =
    | 'container'
    | 'panel'
    | 'tabs'
    | 'accordion'
    | 'modal'
    | 'drawer'
    | 'text-field'
    | 'textarea'
    | 'checkbox'
    | 'radio'
    | 'toggle'
    | 'dropdown'
    | 'slider'
    | 'date-picker'
    | 'file-upload'
    | 'heading'
    | 'paragraph'
    | 'label'
    | 'image-placeholder'
    | 'icon'
    | 'avatar'
    | 'badge'
    | 'tooltip'
    | 'navbar'
    | 'sidebar'
    | 'breadcrumb'
    | 'pagination'
    | 'link'
    | 'menu'
    | 'button'
    | 'icon-button'
    | 'table'
    | 'list'
    | 'card'
    | 'tree-view'
    | 'alert'
    | 'toast'
    | 'progress-bar'
    | 'spinner'
    | 'skeleton'

export type ComponentState = 'default' | 'hover' | 'disabled' | 'active' | 'focused'

export type WireframeComponent = {
    readonly id: ComponentId
    readonly kind: ComponentKind
    readonly bounds: Bounds
    readonly rotation: number
    readonly text: string
    readonly placeholder: string
    readonly state: ComponentState
    readonly locked: boolean
    readonly visible: boolean
    readonly name: string
    readonly groupId: ComponentId | null
    readonly style: ComponentStyle
    readonly zIndex: number
}

export type ComponentStyle = {
    readonly fill: string
    readonly stroke: string
    readonly strokeWidth: number
    readonly cornerRadius: number
    readonly opacity: number
    readonly fontSize: number
    readonly fontWeight: number
    readonly textAlign: 'left' | 'center' | 'right'
}

export type Page = {
    readonly id: PageId
    readonly name: string
    readonly components: readonly WireframeComponent[]
}

export type Hotspot = {
    readonly id: HotspotId
    readonly bounds: Bounds
    readonly sourcePageId: PageId
    readonly targetPageId: PageId
}

export type Project = {
    readonly id: ProjectId
    readonly name: string
    readonly pages: readonly Page[]
    readonly hotspots: readonly Hotspot[]
    readonly createdAt: number
    readonly updatedAt: number
}

export type RenderMode = 'sketchy' | 'clean'

export type PaletteEntry = {
    readonly kind: ComponentKind
    readonly category: ComponentCategory
    readonly label: string
    readonly defaultSize: Size
}
