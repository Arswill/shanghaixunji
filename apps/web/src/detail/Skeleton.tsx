export function CreatureDetailSkeleton() {
  return (
    <div data-testid="creature-detail-skeleton" className="p-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Image placeholder */}
        <div className="space-y-4">
          <div className="aspect-square bg-bg-raised rounded-lg border border-acc-bronze/30" />
          <div className="h-16 bg-bg-raised rounded border border-acc-bronze/30" />
        </div>
        {/* Right: Text placeholder */}
        <div className="space-y-3">
          <div className="h-10 bg-bg-raised rounded w-1/3" />
          <div className="h-4 bg-bg-raised rounded w-1/4" />
          <div className="h-4 bg-bg-raised rounded w-1/2" />
          <div className="h-32 bg-bg-raised rounded" />
          <div className="h-8 bg-bg-raised rounded w-1/4" />
        </div>
      </div>
    </div>
  )
}
