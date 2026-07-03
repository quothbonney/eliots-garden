import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

export function InfoDialog({
  trigger,
  title,
  children,
}: {
  trigger: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <Dialog.Content
          className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-xl max-h-[80dvh] overflow-y-auto rounded-sm p-8 focus:outline-none"
          style={{
            background: 'linear-gradient(to bottom, rgb(18,13,32), rgb(10,6,20))',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
          }}
        >
          <Dialog.Title className="text-sm uppercase tracking-[0.25em] text-white/60 font-light mb-6">
            {title}
          </Dialog.Title>
          <div className="space-y-4 text-[14px] leading-[1.75] text-white/75 font-light tracking-wide">
            {children}
          </div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
