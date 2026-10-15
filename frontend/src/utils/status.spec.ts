import { describe, expect, it } from 'vitest'
import { statusBadgeDisplay, statusOptionFor } from './status'

describe('statusOptionFor', () => {
  it('uses the same colors as the status picker', () => {
    expect(statusOptionFor('active')).toEqual({
      value: 'active',
      label: 'Active',
      color: '#1e5c32',
    })
    expect(statusOptionFor('urgent')).toEqual({
      value: 'urgent',
      label: 'Urgent',
      color: '#9f2d2d',
    })
    expect(statusOptionFor('attention')).toEqual({
      value: 'attention',
      label: 'Attention',
      color: '#8a5a12',
    })
    expect(statusOptionFor('pending')).toEqual({
      value: 'pending',
      label: 'Pending',
      color: '#1f4d8a',
    })
    expect(statusOptionFor('draft')).toEqual({
      value: 'draft',
      label: 'Draft',
      color: '#5b4a8a',
    })
    expect(statusOptionFor('archived')).toEqual({
      value: 'archived',
      label: 'Archived',
      color: '#5c5d61',
    })
    expect(statusOptionFor('in-progress')).toEqual(statusOptionFor('active'))
  })
})

describe('statusBadgeDisplay', () => {
  it('returns tinted backgrounds for list badges', () => {
    const active = statusBadgeDisplay('active')
    expect(active.background).toBe('var(--st-green-bg)')
    expect(active.color).toBe('var(--st-green)')
    expect(active.border).toBeUndefined()
  })

  it('uses distinct colors for urgent, attention, pending, and draft', () => {
    expect(statusBadgeDisplay('urgent').color).toBe('var(--st-red)')
    expect(statusBadgeDisplay('attention').color).toBe('var(--st-amber)')
    expect(statusBadgeDisplay('pending').color).toBe('var(--st-blue)')
    expect(statusBadgeDisplay('draft').color).toBe('var(--st-violet)')
  })
})
