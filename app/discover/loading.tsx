export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-8 w-40 bg-muted/50 rounded-lg animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="paper-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-muted/30 rounded-full animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-muted/40 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-full bg-muted/20 rounded-full animate-pulse" />
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-6 w-14 bg-muted/30 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
