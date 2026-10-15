import { onUnmounted, shallowRef, type Ref } from 'vue'

const MENU_WIDTH = 168
const MENU_HEIGHT_ESTIMATE = 132
const GAP = 6
const VIEWPORT_PADDING = 8

export function useAnchoredMenu(anchor: Ref<HTMLElement | null>) {
  const menuStyle = shallowRef<Record<string, string>>({})

  function updatePosition() {
    const el = anchor.value
    if (!el) return

    const rect = el.getBoundingClientRect()
    let top = rect.bottom + GAP
    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING),
    )

    if (top + MENU_HEIGHT_ESTIMATE > window.innerHeight - VIEWPORT_PADDING) {
      top = rect.top - GAP - MENU_HEIGHT_ESTIMATE
    }
    top = Math.max(VIEWPORT_PADDING, top)

    menuStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      right: 'auto',
      zIndex: '120',
    }
  }

  function bindListeners() {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
  }

  function unbindListeners() {
    window.removeEventListener('resize', updatePosition)
    window.removeEventListener('scroll', updatePosition, true)
  }

  onUnmounted(unbindListeners)

  return { menuStyle, updatePosition, bindListeners, unbindListeners }
}
