import { reactive } from 'vue'

export interface ConfirmationOptions {
  title: string
  message: string
  confirmLabel?: string
  confirmColor?: string
}

export function useConfirmation() {
  const confirmation = reactive({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    confirmColor: 'primary',
  })
  let resolveRequest: ((confirmed: boolean) => void) | null = null

  function requestConfirmation(options: ConfirmationOptions) {
    if (resolveRequest) {
      resolveRequest(false)
    }

    Object.assign(confirmation, {
      open: true,
      confirmLabel: 'Confirm',
      confirmColor: 'primary',
      ...options,
    })

    return new Promise<boolean>((resolve) => {
      resolveRequest = resolve
    })
  }

  function resolveConfirmation(confirmed: boolean) {
    const resolve = resolveRequest
    resolveRequest = null
    confirmation.open = false
    resolve?.(confirmed)
  }

  function updateConfirmationOpen(open: boolean) {
    if (!open) {
      resolveConfirmation(false)
      return
    }

    confirmation.open = true
  }

  return {
    confirmation,
    requestConfirmation,
    resolveConfirmation,
    updateConfirmationOpen,
  }
}
