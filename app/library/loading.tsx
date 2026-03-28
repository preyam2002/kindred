export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-8 w-32 bg-muted/50 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-20 bg-muted/30 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="paper-card overflow-hidden">
              <div className="aspect-[2/3] bg-muted/30 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
