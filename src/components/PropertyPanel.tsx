import { useShallow } from 'zustand/react/shallow'
import { useCanvasStore, selectSelectedComponents } from '../store/canvas-store'
import type { ComponentState } from '../types/component'

export function PropertyPanel() {
    const selectedComponents = useCanvasStore(useShallow(selectSelectedComponents))
    const setComponentStyle = useCanvasStore((s) => s.setComponentStyle)
    const setComponentState = useCanvasStore((s) => s.setComponentState)
    const setComponentText = useCanvasStore((s) => s.setComponentText)
    const updateComponent = useCanvasStore((s) => s.updateComponent)

    if (selectedComponents.length === 0) {
        return (
            <div className="flex h-full w-56 flex-col border-l border-gray-200 bg-gray-50">
                <div className="p-3 text-xs text-gray-400">Select a component to edit its properties</div>
            </div>
        )
    }

    if (selectedComponents.length > 1) {
        return (
            <div className="flex h-full w-56 flex-col border-l border-gray-200 bg-gray-50">
                <div className="p-3 text-xs text-gray-500">{selectedComponents.length} components selected</div>
            </div>
        )
    }

    const component = selectedComponents[0]

    return (
        <div className="flex h-full w-56 flex-col border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="border-b border-gray-200 p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Component</div>
                <div className="text-sm font-medium text-gray-800">{component.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{component.kind}</div>
            </div>

            {/* Dimensions */}
            <Section title="Dimensions">
                <div className="grid grid-cols-2 gap-2">
                    <NumberInput label="X" value={component.bounds.x} onChange={(v) => updateComponent(component.id, { bounds: { ...component.bounds, x: v } })} />
                    <NumberInput label="Y" value={component.bounds.y} onChange={(v) => updateComponent(component.id, { bounds: { ...component.bounds, y: v } })} />
                    <NumberInput label="W" value={component.bounds.width} onChange={(v) => updateComponent(component.id, { bounds: { ...component.bounds, width: v } })} />
                    <NumberInput label="H" value={component.bounds.height} onChange={(v) => updateComponent(component.id, { bounds: { ...component.bounds, height: v } })} />
                </div>
            </Section>

            {/* Content */}
            <Section title="Content">
                <label className="block">
                    <span className="text-[10px] text-gray-500">Text</span>
                    <input
                        type="text"
                        value={component.text}
                        onChange={(e) => setComponentText(component.id, e.target.value)}
                        className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                    />
                </label>
                <label className="mt-2 block">
                    <span className="text-[10px] text-gray-500">Placeholder</span>
                    <input
                        type="text"
                        value={component.placeholder}
                        onChange={(e) => updateComponent(component.id, { placeholder: e.target.value })}
                        className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                    />
                </label>
            </Section>

            {/* Typography */}
            <Section title="Typography">
                <div className="grid grid-cols-2 gap-2">
                    <NumberInput label="Size" value={component.style.fontSize} onChange={(v) => setComponentStyle(component.id, { fontSize: v })} />
                    <NumberInput label="Weight" value={component.style.fontWeight} onChange={(v) => setComponentStyle(component.id, { fontWeight: v })} step={100} />
                </div>
                <div className="mt-2 flex gap-1">
                    {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                            key={align}
                            className={`flex-1 rounded border px-2 py-1 text-[10px] ${component.style.textAlign === align ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-500'}`}
                            onClick={() => setComponentStyle(component.id, { textAlign: align })}
                        >
                            {align}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Style */}
            <Section title="Style">
                <div className="grid grid-cols-2 gap-2">
                    <ColorInput label="Fill" value={component.style.fill} onChange={(v) => setComponentStyle(component.id, { fill: v })} />
                    <ColorInput label="Stroke" value={component.style.stroke} onChange={(v) => setComponentStyle(component.id, { stroke: v })} />
                    <NumberInput label="Border" value={component.style.strokeWidth} onChange={(v) => setComponentStyle(component.id, { strokeWidth: v })} step={0.5} />
                    <NumberInput label="Radius" value={component.style.cornerRadius} onChange={(v) => setComponentStyle(component.id, { cornerRadius: v })} />
                    <NumberInput label="Opacity" value={component.style.opacity} onChange={(v) => setComponentStyle(component.id, { opacity: v })} step={0.1} min={0} max={1} />
                </div>
            </Section>

            {/* State */}
            <Section title="State">
                <select
                    value={component.state}
                    onChange={(e) => setComponentState(component.id, e.target.value as ComponentState)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                >
                    <option value="default">Default</option>
                    <option value="hover">Hover</option>
                    <option value="active">Active</option>
                    <option value="focused">Focused</option>
                    <option value="disabled">Disabled</option>
                </select>
            </Section>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border-b border-gray-200 p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{title}</div>
            {children}
        </div>
    )
}

function NumberInput({
    label,
    value,
    onChange,
    step = 1,
    min,
    max,
}: {
    label: string
    value: number
    onChange: (v: number) => void
    step?: number
    min?: number
    max?: number
}) {
    return (
        <label className="block">
            <span className="text-[10px] text-gray-500">{label}</span>
            <input
                type="number"
                value={Math.round(value * 100) / 100}
                onChange={(e) => onChange(Number(e.target.value))}
                step={step}
                min={min}
                max={max}
                className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
            />
        </label>
    )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="block">
            <span className="text-[10px] text-gray-500">{label}</span>
            <div className="mt-0.5 flex items-center gap-1">
                <input
                    type="color"
                    value={value === 'transparent' ? '#ffffff' : value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border border-gray-300"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded border border-gray-300 px-1 py-0.5 text-[10px] focus:border-blue-400 focus:outline-none"
                />
            </div>
        </label>
    )
}
