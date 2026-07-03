export function parseSpeakerAnnotations(text: string): Record<string, string> {
  const annotations: Record<string, string> = {}
  const lines = text.split('\n')
  
  let currentSpeakerId: string | null = null
  let currentContent: string[] = []
  
  for (const line of lines) {
    const speakerMatch = line.match(/^\[(.*?)\]$/)
    
    if (speakerMatch) {
      // Save previous speaker's annotation if it exists
      if (currentSpeakerId && currentContent.length > 0) {
        annotations[currentSpeakerId] = currentContent.join('\n').trim()
      }
      
      // Start new speaker
      currentSpeakerId = speakerMatch[1]
      currentContent = []
    } else if (currentSpeakerId) {
      currentContent.push(line)
    }
  }
  
  // Save the last one
  if (currentSpeakerId && currentContent.length > 0) {
    annotations[currentSpeakerId] = currentContent.join('\n').trim()
  }
  
  return annotations
}
