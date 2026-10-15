export function truncateText(value: string, maxChars: number): { text: string; truncated: boolean } {
  const trimmed = value.trim()
  if (trimmed.length <= maxChars) return { text: trimmed, truncated: false }
  return { text: trimmed.slice(0, maxChars).trimEnd(), truncated: true }
}
