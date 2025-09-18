'use client';

import YooptaDemoEditor from '../../components/marketing components/yoopta-demo-editor';

export default function ProductDemoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
              Mathy Demo Suite
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              Notion-Style Document Editor
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors duration-200 hover:border-neutral-300 hover:bg-neutral-100">
              Share
            </button>
            <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500">
              Record
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
          <section className="px-8 py-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                Document Editor
              </p>
              <div className="relative mt-4 rounded-2xl border border-neutral-200 bg-white px-6 py-6 shadow-sm transition-all duration-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                <YooptaDemoEditor />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
