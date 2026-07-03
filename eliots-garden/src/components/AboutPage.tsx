import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

function Work({ children }: { children: ReactNode }) {
  return <em className="italic text-amber-100/80">{children}</em>
}

const linkClass =
  'text-amber-300/80 hover:text-amber-300 underline decoration-amber-300/30 underline-offset-2 transition-colors'

export function AboutPage({ trigger }: { trigger: ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/80" />
        <Dialog.Content
          className="fixed inset-0 z-[70] overflow-y-auto focus:outline-none"
          style={{
            background:
              'radial-gradient(ellipse 1100px 700px at 50% -5%, rgba(217,180,120,0.09), transparent 55%), ' +
              'radial-gradient(ellipse 900px 600px at 80% 100%, rgba(40,60,90,0.06), transparent 50%), ' +
              'linear-gradient(180deg, #070707, #000000 70%)',
          }}
        >
          <Dialog.Close asChild>
            <button
              className="fixed top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </Dialog.Close>

          <div className="min-h-full px-6 py-16 md:py-24">
            <div className="max-w-xl mx-auto">
              <Dialog.Title className="text-sm uppercase tracking-[0.25em] text-white/60 font-light text-center mb-12">
                About Eliot&rsquo;s Garden
              </Dialog.Title>

              <figure className="relative mb-12">
                {/* Soft glow behind the portrait */}
                <div
                  aria-hidden
                  className="absolute -inset-10 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse closest-side, rgba(217,180,120,0.13), transparent 70%)',
                    filter: 'blur(24px)',
                  }}
                />
                <img
                  src="/images/jack-carson-by-aimee-yu.jpg"
                  alt="Jack David Carson"
                  width={900}
                  height={600}
                  className="relative w-full rounded-sm border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                />
                <figcaption className="relative mt-3 text-[10px] uppercase tracking-[0.15em] text-white/30 font-light text-right">
                  Photograph by Aimee Yu
                </figcaption>
              </figure>

              <div className="space-y-5 text-[15px] leading-[1.85] text-white/75 font-light tracking-wide">
                <p>
                  I am Jack David Carson, an MIT undergraduate studying electrical engineering with
                  computer science. An avid poet myself, I first opened <Work>The Waste Land</Work>{' '}
                  at the age of 12. Over more than ten years of close reading, I have obsessed over
                  the structure and references of this challenging work.
                </p>
                <p>
                  I believe that while the difficulty of <Work>The Waste Land</Work> is fundamental
                  to its meaning, the modern reader is unlikely to appreciate its beauty and
                  profundity without a guide. The existing online resources are scattered, overly
                  academic, or hidden behind institutional paywalls. Eliot&rsquo;s Garden was built to
                  democratize access to T.&thinsp;S.&thinsp;Eliot&rsquo;s masterpiece through an
                  interface familiar to younger readers.
                </p>
                <p>
                  The title &ldquo;Eliot&rsquo;s Garden&rdquo; draws from Line 71 of{' '}
                  <Work>The Waste Land</Work>: &ldquo;That corpse you planted last year in your
                  garden.&rdquo; It is among the most arresting images in the poem. Many readers
                  prefer to think of the work as a collage, or a shattered monument, or a heap of
                  broken ramparts. I prefer to think of it as a garden, and as this garden in
                  particular, in which Eliot pleads with the reader to help him cultivate the
                  hibernating roots of a culture he believes to be in decline. This site, in its
                  way, is my own minor contribution to that vision.
                </p>
                <p>
                  Outside of <Work>The Waste Land</Work>, I consider <Work>Little Gidding</Work>{' '}
                  the finest Eliot poem. Outside of poetry, I love motorcycle racing, opera, EDM,
                  and computational biology.
                </p>
              </div>

              <div className="mt-12 pt-6 border-t border-white/[0.06] text-[13px] font-light tracking-wide text-white/50">
                Read more at{' '}
                <a
                  href="https://news.mit.edu/2025/qa-jack-carson-ethics-of-catastrophe-1117"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  MIT News
                </a>{' '}
                and{' '}
                <a
                  href="https://jdcarson.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  jdcarson.com
                </a>
                .
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
