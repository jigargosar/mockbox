import { useToastStore } from '../utils/toast'

export function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts)

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white shadow-lg"
                >
                    {t.message}
                </div>
            ))}
        </div>
    )
}
