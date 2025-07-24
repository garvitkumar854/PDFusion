
/**
 * Splits a long string of text into smaller chunks of a specified size.
 * Tries to split at sensible boundaries like paragraphs or sentences.
 */
export function splitText(
  text: string,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
  } = {}
): string[] {
  const { chunkSize = 1000, chunkOverlap = 100 } = options;

  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const endIndex = Math.min(currentIndex + chunkSize, text.length);
    let chunk = text.substring(currentIndex, endIndex);

    // If not the last chunk, try to find a natural break point to end the chunk.
    if (endIndex < text.length) {
      let splitPosition = -1;

      // Prefer to split at paragraph breaks
      splitPosition = chunk.lastIndexOf('\n\n');
      if (splitPosition === -1) {
        // Otherwise, split at sentence breaks
        splitPosition = chunk.lastIndexOf('. ');
      }
      if (splitPosition === -1) {
        // Finally, split at word breaks
        splitPosition = chunk.lastIndexOf(' ');
      }

      if (splitPosition !== -1) {
        chunk = chunk.substring(0, splitPosition + 1);
      }
    }

    chunks.push(chunk);

    const nextIndex = currentIndex + chunk.length - chunkOverlap;
    currentIndex = Math.max(nextIndex > currentIndex ? nextIndex : currentIndex + 1, currentIndex + chunk.length);
  }

  return chunks;
}
