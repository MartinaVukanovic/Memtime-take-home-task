import type { RouteLocationRaw } from 'vue-router'
import { useRouter } from 'vue-router'

export function useRowLink(to: RouteLocationRaw) {
  const router = useRouter()

  function activate() {
    return router.push(to)
  }

  function onRowKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      void activate()
    }
  }

  return { activate, onRowKeydown }
}
