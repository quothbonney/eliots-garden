interface WordProps {
  word: Token
  speakerColor?: string
  dropcap?: boolean
}

// Purely presentational: interaction (annotation clicks) lives on the
// phrase-level button in PoemView, so plain words are not focusable noise.
export function Word({ word, speakerColor, dropcap }: WordProps) {
  if (word.isWhitespace) {
    return <span>{word.text}</span>
  }

  return (
    <span className="px-0.5" style={speakerColor ? { color: speakerColor } : undefined}>
      {dropcap ? (
        <>
          <span className="dropcap-letter">{word.text.charAt(0)}</span>
          {word.text.slice(1)}
        </>
      ) : (
        word.text
      )}
    </span>
  )
}

export type Token = {
  id: string
  text: string
  lineId: string
  isWhitespace: boolean
  annotationId?: string // ID of scholarly annotation
}
