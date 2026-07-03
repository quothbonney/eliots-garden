import { InfoDialog } from './InfoDialog'

const navButtonClass =
  'text-[10px] font-light tracking-[0.25em] text-white/45 uppercase hover:text-white/70 transition-all duration-500 px-2 py-1'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-[2px]">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Site Title - aligned with Marginalia */}
        <h1 className="text-[13px] font-light tracking-[0.35em] text-white/60 uppercase">
          Eliot's Garden
        </h1>

        {/* Navigation */}
        <nav className="flex gap-6">
          <InfoDialog title="About" trigger={<button className={navButtonClass}>About</button>}>
            <p>
              Eliot's Garden is an interactive edition of T.&thinsp;S.&thinsp;Eliot's{' '}
              <em className="font-serif italic text-amber-100/80">The Waste Land</em> (1922). The
              poem is presented whole, with scholarly marginalia, an interpretation of its shifting
              speakers, and the web of its allusions drawn as arcs across the text.
            </p>
            <p>
              Phrases underlined in amber carry annotations — select one to read it. The toggles
              control three layers: <span className="text-white/90">Speakers</span> colors each
              voice, <span className="text-white/90">Arcs</span> draws connections between distant
              lines, and <span className="text-white/90">Notes</span> shows the annotation
              underlines.
            </p>
            <p>
              The speaker attributions are one reader's interpretation, offered as a way in. The
              poem knowingly resists this clarity; that resistance is part of its meaning. When
              ready, turn the speakers off and read it plain.
            </p>
          </InfoDialog>
          <InfoDialog
            title="References"
            trigger={<button className={navButtonClass}>References</button>}
          >
            <p className="text-white/50 text-[12px]">
              Works cited or drawn upon in the annotations:
            </p>
            <ul className="space-y-2 text-[13px]">
              <li>T. S. Eliot, <em className="italic">The Waste Land</em> and the author's notes (1922)</li>
              <li>Allyson Booth, <em className="italic">Reading The Waste Land from the Bottom Up</em></li>
              <li>Petronius, <em className="italic">Satyricon</em></li>
              <li>Ovid, <em className="italic">Metamorphoses</em></li>
              <li>Geoffrey Chaucer, <em className="italic">The Canterbury Tales</em></li>
              <li>Dante Alighieri, <em className="italic">Inferno</em> (Longfellow translation)</li>
              <li>The Book of Ezekiel (KJV)</li>
              <li>Richard Wagner, <em className="italic">Tristan und Isolde</em></li>
              <li>James George Frazer, <em className="italic">The Golden Bough</em></li>
              <li>Aldous Huxley, <em className="italic">Crome Yellow</em></li>
              <li>Charles Baudelaire, <em className="italic">Les Fleurs du Mal</em></li>
              <li>Marie Larisch, <em className="italic">My Past</em></li>
            </ul>
            <p className="text-white/50 text-[12px] pt-2">
              Images: Ezra Pound by Alvin Langdon Coburn (1913); <em className="italic">The Golden
              Bough</em>, third edition; Dante and Virgil among the uncommitted, Priamo della
              Quercia, British Library Yates Thompson MS 36; Baudelaire self-portrait.
            </p>
          </InfoDialog>
        </nav>
      </div>
      {/* Subtle dark grey horizontal rule */}
      <div className="relative">
        <div className="absolute inset-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="absolute left-1/4 right-1/4 h-[1px] bg-white/[0.06]" />
      </div>
    </header>
  )
}
