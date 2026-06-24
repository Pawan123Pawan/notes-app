'use client'

import * as React from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

type CopyToClipboardButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'onClick'
> & {
  text: string
  successMessage?: string
  errorMessage?: string
  onCopy?: (text: string, result: boolean) => void
}

function CopyToClipboardButton({
  text,
  successMessage = 'Copied to clipboard.',
  errorMessage = 'Could not copy to clipboard.',
  onCopy,
  children,
  ...buttonProps
}: CopyToClipboardButtonProps) {
  return (
    <CopyToClipboard
      onCopy={(copiedText: string, result: boolean) => {
        if (result) {
          toast.success(successMessage)
        } else {
          toast.error(errorMessage)
        }
        onCopy?.(copiedText, result)
      }}
      text={text}
    >
      <Button type="button" {...buttonProps}>
        {children}
      </Button>
    </CopyToClipboard>
  )
}

export { CopyToClipboardButton }
