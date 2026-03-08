import { create } from 'zustand'

type ToastItem = {
    readonly id: number
    readonly message: string
}

type ToastState = {
    readonly toasts: readonly ToastItem[]
    readonly show: (message: string) => void
    readonly dismiss: (id: number) => void
}

let nextToastId = 0

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    show: (message) => {
        const id = nextToastId++
        set((s) => ({ toasts: [...s.toasts, { id, message }] }))
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, 2000)
    },
    dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(message: string) {
    useToastStore.getState().show(message)
}
