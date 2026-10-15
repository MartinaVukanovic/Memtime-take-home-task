import { describe, expect, it } from 'vitest'
import { dismissAppToast, pushAppToast, useAppToast } from './useAppToast'

describe('useAppToast', () => {
  it('queues and dismisses toasts', () => {
    const { toasts } = useAppToast()
    expect(toasts.value).toHaveLength(0)

    pushAppToast('Client created successfully.', 'success')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]?.message).toBe('Client created successfully.')
    expect(toasts.value[0]?.tone).toBe('success')

    const id = toasts.value[0]!.id
    dismissAppToast(id)
    expect(toasts.value).toHaveLength(0)
  })
})
