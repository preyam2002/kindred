export default function MatchesLoading() {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-8 w-36 bg-muted/50 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="paper-card p-5 flex items-center gap-4">
              <div className="h-14 w-14 bg-muted/30 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-muted/40 rounded animate-pulse" />
                <div className="h-3 w-48 bg-muted/30 rounded animate-pulse" />
              </div>
              <div className="h-10 w-24 bg-muted/30 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
