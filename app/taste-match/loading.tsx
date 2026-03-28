export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="h-8 w-44 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-5 w-72 bg-muted/30 rounded-lg animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="paper-card p-6 space-y-4">
              <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
              <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
