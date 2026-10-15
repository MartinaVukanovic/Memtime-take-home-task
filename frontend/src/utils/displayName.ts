const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Removes demo API suffixes like "Project 1 for Client 1". */
export function displayName(name: string): string {
  return name.replace(/\s+for\s+client\s+\d+\s*$/i, '').trim()
}

/** Breadcrumb label: never show raw ids or "Client <uuid>" placeholders. */
export function breadcrumbLabel(entity: { name?: string } | null | undefined): string {
  const raw = entity?.name?.trim()
  if (!raw) return '…'

  const cleaned = displayName(raw)
  if (UUID_PATTERN.test(cleaned)) return '…'

  const placeholder = /^(Client|Project|Task)\s+(.+)$/i.exec(cleaned)
  if (placeholder && UUID_PATTERN.test(placeholder[2])) {
    return placeholder[1]
  }

  return cleaned
}
