import { readonly, shallowRef } from 'vue'

export type AppToastTone = 'success' | 'error'

export interface AppToast {
  id: number
  message: string
  tone: AppToastTone
}

const toasts = shallowRef<AppToast[]>([])
let nextId = 1

export function pushAppToast(message: string, tone: AppToastTone) {
  const toast: AppToast = { id: nextId++, message, tone }
  toasts.value = [...toasts.value, toast]
}

export function dismissAppToast(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export function useAppToast() {
  return {
    toasts: readonly(toasts),
    pushAppToast,
    dismissAppToast,
  }
}
