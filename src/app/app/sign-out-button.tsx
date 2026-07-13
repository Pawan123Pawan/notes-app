'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { showErrorToast } from '@/lib/utils'

export function SignOutButton() {
  const router = useRouter()

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut()
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      router.push('/login')
      router.refresh()
    },
    onError: (error) => {
      showErrorToast('Sign out failed', error, 'Unable to sign out.')
    },
  })

  return (
    <Button
      variant="outline"
      loading={signOutMutation.isPending}
      onClick={() => signOutMutation.mutate()}
    >
      Sign out
    </Button>
  )
}
