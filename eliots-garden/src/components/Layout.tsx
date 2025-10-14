import { AnnotationPanel } from './left/AnnotationPanel'
import { PoemView } from './poem/PoemView'
import { Explorer } from './right/Explorer'
import { Controls } from './right/Controls'
import { Header } from './Header'

export function Layout() {
  return (
    <>
      <Header />
      <div className="min-h-screen grid grid-cols-[360px_1fr_560px] gap-0 pt-[45px]">
        <aside className="border-r border-white/5 sticky top-[45px] h-[calc(100vh-45px)] overflow-hidden shadow-[1px_0_0_rgba(255,255,255,0.02)]">
          <AnnotationPanel />
        </aside>
        <main className="overflow-y-auto h-[calc(100vh-45px)] relative bg-black/20">
          <PoemView />
        </main>
        <aside className="border-l border-white/5 sticky top-[45px] h-[calc(100vh-45px)] overflow-hidden shadow-[-1px_0_0_rgba(255,255,255,0.02)] flex">
          <div className="w-[140px] flex-shrink-0 border-r border-white/5">
            <Controls />
          </div>
          <div className="flex-1 min-w-0">
            <Explorer />
          </div>
        </aside>
      </div>
    </>
  )
}


