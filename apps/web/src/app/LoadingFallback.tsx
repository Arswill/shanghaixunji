export function LoadingFallback({ message = '加载中…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]" data-testid="loading-fallback">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-2 border-immortal-gold/40 border-t-cinnabar rounded-full animate-spin mb-3" />
        <p className="text-ink-dan text-sm font-display">{message}</p>
      </div>
    </div>
  )
}
