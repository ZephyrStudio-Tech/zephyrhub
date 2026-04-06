export default function BackofficeLoading() {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900 p-4 gap-4">
        <div className="h-10 w-32 bg-slate-800 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-2 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-slate-800 rounded-xl animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="h-12 bg-slate-800 rounded-xl animate-pulse" />
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 p-6 overflow-auto bg-slate-50">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-64 bg-slate-100 rounded-xl animate-pulse" />
        </div>

        {/* Kanban columns skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="flex-shrink-0 w-72 bg-slate-100/50 rounded-2xl p-3"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-5 w-24 bg-slate-200 rounded-lg animate-pulse"
                  style={{ animationDelay: `${colIndex * 100}ms` }}
                />
                <div
                  className="h-5 w-6 bg-slate-200 rounded-full animate-pulse"
                  style={{ animationDelay: `${colIndex * 100 + 50}ms` }}
                />
              </div>

              {/* Cards skeleton */}
              <div className="space-y-3">
                {Array.from({ length: colIndex === 0 ? 3 : colIndex === 1 ? 2 : colIndex === 2 ? 3 : 1 }).map((_, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse"
                    style={{ animationDelay: `${colIndex * 100 + cardIndex * 150}ms` }}
                  >
                    {/* Card title */}
                    <div className="h-4 w-3/4 bg-slate-200 rounded-lg mb-3" />
                    {/* Card subtitle */}
                    <div className="h-3 w-1/2 bg-slate-100 rounded-lg mb-3" />
                    {/* Card badges */}
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-cyan-50 rounded-full" />
                      <div className="h-5 w-12 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
