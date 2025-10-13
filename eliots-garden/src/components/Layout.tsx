import { AnnotationPanel } from './left/AnnotationPanel'
import { PoemView } from './poem/PoemView'
import { Explorer } from './right/Explorer'

export function Layout() {
  return (
    <div className="min-h-screen grid grid-cols-[360px_1fr_420px] gap-0">
      <aside className="border-r border-white/10 sticky top-0 h-screen overflow-hidden">
        <AnnotationPanel />
      </aside>
      <main className="overflow-y-auto h-screen">
        <PoemView />
      </main>
      <aside className="border-l border-white/10 sticky top-0 h-screen overflow-hidden">
        <Explorer />
      </aside>
    </div>
  )
}


