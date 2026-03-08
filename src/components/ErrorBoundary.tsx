import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info.componentStack)
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 32, fontFamily: 'monospace' }}>
                    <h1 style={{ color: 'red' }}>Render Error</h1>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666' }}>{this.state.error.stack}</pre>
                </div>
            )
        }
        return this.props.children
    }
}
