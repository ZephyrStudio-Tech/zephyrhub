export default function PortalLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar skeleton */}
        <aside className="hidden md:flex w-64 border-r border-slate-200 min-h-[calc(100vh-73px)] p-4">
          <div className="w-full space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-slate-100 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 p-6">
          {/* Welcome section */}
          <div className="mb-8">
            <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>

          {/* Progress section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
                  <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
