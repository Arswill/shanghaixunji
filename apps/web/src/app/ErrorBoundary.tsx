import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useBondStore } from '../bond/bondStore'
import { useCollection } from '../collection/useCollection'
import { useGuardianStore } from '../guardian/guardianStore'

function clearLocalProgress() {
  try {
    useBondStore.getState().reset()
    useCollection.getState().reset()
    useGuardianStore.getState().reset()
  } catch (e) {
    console.error('[ErrorBoundary] reset stores failed:', e)
  }
  try {
    localStorage.clear()
  } catch (e) {
    console.error('[ErrorBoundary] localStorage.clear failed:', e)
  }
  window.location.reload()
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-[100dvh] bg-bg-base text-ink-primary flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <div className="text-5xl">⚠️</div>
            <h1 className="font-display text-2xl text-acc-gold">山海图卷暂时混沌</h1>
            <p className="text-ink-muted text-sm">
              页面发生异常，请尝试刷新。若持续出现，可清除本地数据后重试。
            </p>
            {this.state.error && (
              <pre className="text-left text-xs text-ink-faint bg-bg-deep p-3 rounded border border-acc-bronze/30 overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded border border-acc-gold/50 text-acc-gold hover:bg-acc-gold/10 transition-colors"
              >
                刷新页面
              </button>
              <button
                type="button"
                onClick={clearLocalProgress}
                className="px-6 py-2 rounded border border-acc-cinnabar/50 text-acc-cinnabar hover:bg-acc-cinnabar/10 transition-colors"
              >
                清除进度并重置
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
