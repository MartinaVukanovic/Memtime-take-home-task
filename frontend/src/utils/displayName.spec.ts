import { describe, expect, it } from 'vitest'
import { breadcrumbLabel, displayName } from './displayName'

describe('displayName', () => {
  it('removes demo client suffix from project names', () => {
    expect(displayName('Project 1 for Client 1')).toBe('Project 1')
    expect(displayName('Branding Strategy 2025')).toBe('Branding Strategy 2025')
  })
})

describe('breadcrumbLabel', () => {
  const uuid = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'

  it('uses real names from loaded entities', () => {
    expect(breadcrumbLabel({ name: 'Acme Corp' })).toBe('Acme Corp')
    expect(breadcrumbLabel({ name: 'Project 2 for Client 3' })).toBe('Project 2')
  })

  it('hides uuid placeholders and missing names', () => {
    expect(breadcrumbLabel(null)).toBe('…')
    expect(breadcrumbLabel({ name: '' })).toBe('…')
    expect(breadcrumbLabel({ name: uuid })).toBe('…')
    expect(breadcrumbLabel({ name: `Client ${uuid}` })).toBe('Client')
    expect(breadcrumbLabel({ name: `Project ${uuid}` })).toBe('Project')
  })
})
