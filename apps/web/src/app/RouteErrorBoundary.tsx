import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** 自定义降级 UI；接收当前错误，返回 ReactNode */
  fallback?: (error: Error) => ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * 路由级错误边界：局部隔离懒加载路由的渲染错误，
 * 避免单一路由崩溃导致整页白屏。
 * 默认降级 UI 提示「此区域暂时无法加载，请刷新重试」并提供刷新按钮。
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RouteErrorBoundary] caught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error ?? new Error('Unknown error'))
      }
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="max-w-md space-y-4">
            <div className="text-4xl">🌫️</div>
            <h2 className="font-display text-xl text-acc-gold">此区域暂时无法加载</h2>
            <p className="text-ink-muted text-sm">仙雾笼罩，请刷新重试。</p>
            {this.state.error && (
              <pre className="text-left text-xs text-ink-faint bg-bg-deep p-3 rounded border border-acc-bronze/30 overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded border border-acc-gold/50 text-acc-gold hover:bg-acc-gold/10 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
