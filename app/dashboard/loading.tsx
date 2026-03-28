export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-muted/30 rounded-lg animate-pulse" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="paper-card p-6 space-y-3">
              <div className="h-4 w-16 bg-muted/40 rounded animate-pulse" />
              <div className="h-8 w-12 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content sections skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="paper-card p-6 space-y-4">
              <div className="h-5 w-32 bg-muted/40 rounded animate-pulse" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-muted/30 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
