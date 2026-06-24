'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { authClient } from '@/lib/auth-client'
import { showErrorToast } from '@/lib/utils'

type AcceptInvitationCardProps = {
  invitationId: string
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
}

export function AcceptInvitationCard({
  invitationId,
  workspaceId,
  workspaceName,
  workspaceSlug,
}: AcceptInvitationCardProps) {
  const router = useRouter()

  const acceptInvitation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not accept invitation.')
      }

      const { error: setActiveError } = await authClient.organization.setActive(
        {
          organizationId: workspaceId,
        },
      )
      if (setActiveError) {
        throw new Error(setActiveError.message ?? 'Could not open workspace.')
      }
    },
    onSuccess: () => {
      router.push(`/app/${workspaceSlug}`)
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Could not accept invitation.', error)
    },
  })

  const errorMessage =
    acceptInvitation.error instanceof Error
      ? acceptInvitation.error.message
      : null

  return (
    <Card className="ring-border/60 border-0 shadow-none ring-1">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Accept invitation
        </CardTitle>
        <CardDescription>
          Join <code>{workspaceName}</code> and continue to that workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {errorMessage ? (
          <FieldError className="bg-destructive/10 rounded-md px-3 py-2">
            {errorMessage}
          </FieldError>
        ) : null}
        <Button
          className="w-full"
          loading={acceptInvitation.isPending}
          onClick={() => {
            acceptInvitation.reset()
            acceptInvitation.mutate()
          }}
          type="button"
        >
          Join workspace
        </Button>
      </CardContent>
    </Card>
  )
}
