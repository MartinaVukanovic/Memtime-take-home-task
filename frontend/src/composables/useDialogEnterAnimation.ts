import gsap from 'gsap'
import { nextTick, onMounted, onUnmounted, type ShallowRef } from 'vue'
import { motionDuration } from '../utils/motion'

type ElementRef = Readonly<ShallowRef<HTMLElement | null | undefined>>

export function useDialogEnterAnimation(overlayRef: ElementRef, dialogRef: ElementRef) {
  let ctx: gsap.Context | null = null

  onMounted(() => {
    ctx = gsap.context(() => {
      void nextTick(() => {
        const overlay = overlayRef.value
        const dialog = dialogRef.value
        if (!overlay || !dialog) return

        const duration = motionDuration(0.32)
        gsap.killTweensOf([overlay, dialog])

        if (duration === 0) {
          gsap.set(overlay, { autoAlpha: 1 })
          gsap.set(dialog, { y: 0, scale: 1, autoAlpha: 1 })
          return
        }

        gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'power1.out' })
        gsap.fromTo(
          dialog,
          { y: 12, scale: 0.98, autoAlpha: 0 },
          {
            y: 0,
            scale: 1,
            autoAlpha: 1,
            duration,
            ease: 'power2.out',
            clearProps: 'transform',
          },
        )
      })
    })
  })

  onUnmounted(() => {
    ctx?.revert()
    ctx = null
  })
}
