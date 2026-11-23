import { describe, expect, it } from 'vitest'

import { useConfirmation } from './useConfirmation'

describe('useConfirmation', () => {
  it('resolves an accepted request and closes the dialog', async () => {
    const { confirmation, requestConfirmation, resolveConfirmation } = useConfirmation()
    const result = requestConfirmation({
      title: 'Delete person?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      confirmColor: 'error',
    })

    expect(confirmation.open).toBe(true)
    expect(confirmation.confirmLabel).toBe('Delete')
    resolveConfirmation(true)

    await expect(result).resolves.toBe(true)
    expect(confirmation.open).toBe(false)
  })

  it('resolves a dismissed dialog as canceled', async () => {
    const { requestConfirmation, updateConfirmationOpen } = useConfirmation()
    const result = requestConfirmation({
      title: 'Replace organization?',
      message: 'Current people will be replaced.',
    })

    updateConfirmationOpen(false)

    await expect(result).resolves.toBe(false)
  })
})
