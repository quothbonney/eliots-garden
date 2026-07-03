// Injects a static, crawler-readable rendering of the poem into the built
// index.html, plus schema.org JSON-LD. React replaces #root's children on
// mount, so this content exists purely for crawlers, link previews, and
// no-JS readers. Runs as the last step of `npm run build`.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distIndex = path.join(__dirname, '../dist/index.html')
const poemData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/wasteland-complete.json'), 'utf-8'))

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const clean = (s) => s.replace(/[﻿\r]/g, '').trim()

const parts = []
parts.push('<header><h1>The Waste Land</h1><p>by T. S. Eliot (1922) — an annotated, interactive reading</p></header>')
parts.push('<article>')
let open = false
for (const line of poemData.lines) {
  const text = clean(line.text || '')
  if (line.type === 'blank' || !text) continue
  if (line.type === 'section_header') {
    if (open) parts.push('</section>')
    parts.push(`<section><h2>${esc(text)}</h2>`)
    open = true
  } else if (line.type === 'epigraph' || line.type === 'dedication') {
    parts.push(`<p><em>${esc(text)}</em></p>`)
  } else {
    parts.push(`<div>${esc(text)}</div>`)
  }
}
if (open) parts.push('</section>')
parts.push('</article>')

const staticHtml =
  `<div style="max-width:42rem;margin:0 auto;padding:3rem 1.5rem;">` +
  `<noscript><p>Eliot&#39;s Garden is an interactive annotated edition of the poem; enable JavaScript for the marginalia, speaker voices, and allusion arcs. The full text follows below.</p></noscript>` +
  parts.join('\n') +
  `</div>`

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: "Eliot's Garden",
  url: 'https://eliotsgarden.com/',
  description:
    "An interactive, annotated reading of T. S. Eliot's The Waste Land.",
  about: {
    '@type': 'CreativeWork',
    name: 'The Waste Land',
    author: { '@type': 'Person', name: 'T. S. Eliot' },
    datePublished: '1922',
    inLanguage: 'en',
  },
}

let html = fs.readFileSync(distIndex, 'utf-8')
if (!html.includes('<div id="root"></div>')) {
  console.error('prerender: expected empty <div id="root"></div> in dist/index.html')
  process.exit(1)
}
html = html.replace(
  '</head>',
  `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`
)
html = html.replace('<div id="root"></div>', `<div id="root">${staticHtml}</div>`)
fs.writeFileSync(distIndex, html)
console.log(`prerender: injected ${poemData.lines.length} lines (${(staticHtml.length / 1024).toFixed(1)} kB) into dist/index.html`)
