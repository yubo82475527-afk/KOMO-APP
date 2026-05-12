export function AdminShellSkeleton() {
  return (
    <div className="h-dvh overflow-hidden bg-[#eef2f5] text-[#17202f]">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-[#d7dee7] bg-[#16202d] text-white lg:h-full lg:w-72 lg:border-b-0 lg:border-r lg:border-[#263446]">
          <div className="px-5 py-5">
            <div className="h-4 w-32 rounded bg-white/25" />
            <div className="mt-3 h-3 w-24 rounded bg-white/15" />
            <div className="mt-4 h-10 rounded-lg bg-white/10" />
          </div>
          <div className="flex gap-3 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:overflow-visible lg:px-4">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="min-w-[168px] space-y-1 lg:min-w-0">
                <div className="h-10 rounded-lg bg-white/10" />
                {index === 5 ? (
                  <div className="space-y-1 pl-3">
                    <div className="h-9 rounded-lg bg-white/10" />
                    <div className="h-9 rounded-lg bg-white/10" />
                    <div className="h-9 rounded-lg bg-white/10" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-[#d7dee7] bg-white px-4 py-4 shadow-sm sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="h-7 w-40 rounded bg-[#dbe3ec]" />
                <div className="mt-3 h-4 w-72 max-w-full rounded bg-[#e7edf3]" />
              </div>
              <div className="h-10 w-56 rounded-lg border border-[#d7dee7] bg-[#f8fafc]" />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            <div className="space-y-5 animate-pulse">
              <section className="rounded-lg border border-[#d7dee7] bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="h-20 rounded-lg bg-[#eef2f6]" />
                  <div className="h-20 rounded-lg bg-[#eef2f6]" />
                  <div className="h-20 rounded-lg bg-[#eef2f6]" />
                </div>
              </section>
              <section className="rounded-lg border border-[#d7dee7] bg-white shadow-sm">
                <div className="border-b border-[#e5eaf0] px-4 py-3">
                  <div className="h-5 w-32 rounded bg-[#dbe3ec]" />
                </div>
                <div className="space-y-3 p-4">
                  {Array.from({ length: 8 }, (_, index) => (
                    <div key={index} className="h-10 rounded bg-[#f1f5f9]" />
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
