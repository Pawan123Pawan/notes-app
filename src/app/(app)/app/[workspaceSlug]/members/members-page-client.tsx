'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PageContainer } from '@/components/ui/page-container'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/ui/page-header'
import { authClient } from '@/lib/auth-client'
import dayjs from '@/lib/dayjs'
import { showErrorToast } from '@/lib/utils'

const roles = ['owner', 'admin', 'member'] as const
type WorkspaceRole = (typeof roles)[number]

type MemberRow = {
  id: string
  userId: string
  name: string
  email: string
  role: WorkspaceRole
  createdAt: string | null
}

type InvitationRow = {
  id: string
  email: string
  role: WorkspaceRole
  status: string
  createdAt: string | null
  expiresAt: string | null
}

type MembersPageClientProps = {
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
  currentRole: string
}

const inviteSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  email: z.email('Enter a valid email address'),
})

type InviteFormValues = z.infer<typeof inviteSchema>
const memberTabs = ['members', 'invitations'] as const
type MemberTab = (typeof memberTabs)[number]

function formatRoleLabel(role: WorkspaceRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function toRole(value: unknown): WorkspaceRole {
  if (typeof value === 'string' && roles.includes(value as WorkspaceRole)) {
    return value as WorkspaceRole
  }
  return 'member'
}

function toDate(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return null
}

function getMutationErrorMessage(
  value: unknown,
  fallback: string | null,
): string | null {
  if (value instanceof Error) {
    return value.message
  }
  return fallback
}

function isMemberTab(value: string | null): value is MemberTab {
  return value !== null && memberTabs.includes(value as MemberTab)
}

type MembersTabContentProps = {
  workspaceId: string
  workspaceName: string
  canManageMembers: boolean
}

function MembersTabContent({
  workspaceId,
  workspaceName,
  canManageMembers,
}: MembersTabContentProps) {
  const queryClient = useQueryClient()
  const [memberPendingRemoval, setMemberPendingRemoval] =
    useState<MemberRow | null>(null)

  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listMembers({
        query: { organizationId: workspaceId },
      })

      if (error) {
        throw new Error(error.message ?? 'Could not load members.')
      }

      const rows = (data?.members ?? []).map((member): MemberRow => {
        const memberId = typeof member.id === 'string' ? member.id : ''
        const userId = typeof member.userId === 'string' ? member.userId : ''
        const name =
          member.user && typeof member.user.name === 'string'
            ? member.user.name
            : 'Unknown user'
        const email =
          member.user && typeof member.user.email === 'string'
            ? member.user.email
            : 'Unknown email'
        const role = toRole(member.role)
        const createdAt = toDate(member.createdAt)

        return {
          id: memberId,
          userId,
          name,
          email,
          role,
          createdAt,
        }
      })

      return rows
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await authClient.organization.removeMember({
        organizationId: workspaceId,
        memberIdOrEmail: memberId,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not remove member.')
      }
    },
    onSuccess: () => {
      setMemberPendingRemoval(null)
      void queryClient.invalidateQueries({
        queryKey: ['workspace-members', workspaceId],
      })
    },
    onError: (error) => {
      showErrorToast('Could not remove member.', error)
    },
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string
      role: WorkspaceRole
    }) => {
      const { error } = await authClient.organization.updateMemberRole({
        organizationId: workspaceId,
        memberId,
        role,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not update member role.')
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['workspace-members', workspaceId],
      })
    },
    onError: (error) => {
      showErrorToast('Could not update member role.', error)
    },
  })

  const membersErrorMessage = useMemo(
    () =>
      getMutationErrorMessage(
        membersQuery.error,
        membersQuery.isError ? 'Could not load members.' : null,
      ),
    [membersQuery.error, membersQuery.isError],
  )

  const mutationErrorMessage =
    getMutationErrorMessage(
      removeMemberMutation.error,
      removeMemberMutation.isError ? 'Could not remove member.' : null,
    ) ||
    getMutationErrorMessage(
      updateMemberRoleMutation.error,
      updateMemberRoleMutation.isError ? 'Could not update role.' : null,
    )

  return (
    <>
      {mutationErrorMessage ? (
        <FieldError className="bg-destructive/10 mb-4 rounded-md px-3 py-2">
          {mutationErrorMessage}
        </FieldError>
      ) : null}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersQuery.isLoading ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={5}>
                  Loading members...
                </TableCell>
              </TableRow>
            ) : membersErrorMessage ? (
              <TableRow>
                <TableCell className="text-destructive" colSpan={5}>
                  {membersErrorMessage}
                </TableCell>
              </TableRow>
            ) : membersQuery.data?.length ? (
              membersQuery.data.map((member) => {
                const isUpdatingRole =
                  updateMemberRoleMutation.isPending &&
                  updateMemberRoleMutation.variables?.memberId === member.id
                const isRemovingMember =
                  removeMemberMutation.isPending &&
                  removeMemberMutation.variables === member.id

                return (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {canManageMembers ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            disabled={isUpdatingRole}
                            onValueChange={(value) => {
                              const nextRole = toRole(value)
                              if (nextRole === member.role) {
                                return
                              }
                              updateMemberRoleMutation.reset()
                              updateMemberRoleMutation.mutate({
                                memberId: member.id,
                                role: nextRole,
                              })
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {formatRoleLabel(role)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span
                            className="text-muted-foreground inline-block min-w-[62px] text-xs"
                            aria-live="polite"
                            aria-hidden={!isUpdatingRole}
                          >
                            {isUpdatingRole ? 'Updating...' : '\u00A0'}
                          </span>
                        </div>
                      ) : (
                        formatRoleLabel(member.role)
                      )}
                    </TableCell>
                    <TableCell>
                      {member.createdAt
                        ? dayjs(member.createdAt).format('MMM D, YYYY')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageMembers ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          loading={isRemovingMember}
                          onClick={() => {
                            removeMemberMutation.reset()
                            setMemberPendingRemoval(member)
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Not permitted
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={5}>
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={memberPendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open && !removeMemberMutation.isPending) {
            setMemberPendingRemoval(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberPendingRemoval
                ? `This will remove ${memberPendingRemoval.name} from ${workspaceName}. This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={removeMemberMutation.isPending || !memberPendingRemoval}
              onClick={(event) => {
                event.preventDefault()
                if (!memberPendingRemoval) return
                removeMemberMutation.reset()
                removeMemberMutation.mutate(memberPendingRemoval.id)
              }}
              variant="destructive"
            >
              {removeMemberMutation.isPending ? 'Removing...' : 'Remove member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type InvitationsTabContentProps = {
  workspaceId: string
  canManageInvitations: boolean
}

function InvitationsTabContent({
  workspaceId,
  canManageInvitations,
}: InvitationsTabContentProps) {
  const queryClient = useQueryClient()

  const invitationsQuery = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations({
        query: { organizationId: workspaceId },
      })

      if (error) {
        throw new Error(error.message ?? 'Could not load invitations.')
      }

      const rows = (data ?? []).map((invitation): InvitationRow => {
        const id =
          invitation &&
          typeof invitation === 'object' &&
          'id' in invitation &&
          typeof invitation.id === 'string'
            ? invitation.id
            : ''
        const email =
          invitation &&
          typeof invitation === 'object' &&
          'email' in invitation &&
          typeof invitation.email === 'string'
            ? invitation.email
            : 'Unknown email'
        const role =
          invitation && typeof invitation === 'object'
            ? toRole('role' in invitation ? invitation.role : undefined)
            : 'member'
        const status =
          invitation &&
          typeof invitation === 'object' &&
          'status' in invitation &&
          typeof invitation.status === 'string'
            ? invitation.status
            : 'pending'
        const createdAt =
          invitation && typeof invitation === 'object'
            ? toDate(
                'createdAt' in invitation ? invitation.createdAt : undefined,
              )
            : null
        const expiresAt =
          invitation && typeof invitation === 'object'
            ? toDate(
                'expiresAt' in invitation ? invitation.expiresAt : undefined,
              )
            : null

        return {
          id,
          email,
          role,
          status,
          createdAt,
          expiresAt,
        }
      })

      return rows.filter(
        (invitation) => invitation.status.toLowerCase() === 'pending',
      )
    },
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      })
      if (error) {
        throw new Error(error.message ?? 'Could not cancel invitation.')
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['workspace-invitations', workspaceId],
      })
    },
    onError: (error) => {
      showErrorToast('Could not cancel invitation.', error)
    },
  })

  const invitationsErrorMessage = useMemo(
    () =>
      getMutationErrorMessage(
        invitationsQuery.error,
        invitationsQuery.isError ? 'Could not load invitations.' : null,
      ),
    [invitationsQuery.error, invitationsQuery.isError],
  )

  const mutationErrorMessage = getMutationErrorMessage(
    cancelInvitationMutation.error,
    cancelInvitationMutation.isError ? 'Could not cancel invitation.' : null,
  )

  return (
    <>
      {mutationErrorMessage ? (
        <FieldError className="bg-destructive/10 mb-4 rounded-md px-3 py-2">
          {mutationErrorMessage}
        </FieldError>
      ) : null}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitationsQuery.isLoading ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={6}>
                  Loading invitations...
                </TableCell>
              </TableRow>
            ) : invitationsErrorMessage ? (
              <TableRow>
                <TableCell className="text-destructive" colSpan={6}>
                  {invitationsErrorMessage}
                </TableCell>
              </TableRow>
            ) : invitationsQuery.data?.length ? (
              invitationsQuery.data.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{formatRoleLabel(invitation.role)}</TableCell>
                  <TableCell>{invitation.status}</TableCell>
                  <TableCell>
                    {invitation.createdAt
                      ? dayjs(invitation.createdAt).format('MMM D, YYYY')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {invitation.expiresAt
                      ? dayjs(invitation.expiresAt).format('MMM D, YYYY')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManageInvitations ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        loading={
                          cancelInvitationMutation.isPending &&
                          cancelInvitationMutation.variables === invitation.id
                        }
                        onClick={() => {
                          cancelInvitationMutation.reset()
                          cancelInvitationMutation.mutate(invitation.id)
                        }}
                      >
                        Delete
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Not permitted
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={6}>
                  No pending invitations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

type InviteMemberDialogProps = {
  workspaceId: string
  canInviteMembers: boolean
}

function InviteMemberDialog({
  workspaceId,
  canInviteMembers,
}: InviteMemberDialogProps) {
  const queryClient = useQueryClient()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: '', email: '' },
  })

  const inviteMutation = useMutation({
    mutationFn: async (values: InviteFormValues) => {
      const { error } = await authClient.organization.inviteMember({
        organizationId: workspaceId,
        email: values.email,
        role: 'member',
      })
      if (error) {
        throw new Error(error.message ?? 'Could not send invitation.')
      }
    },
    onSuccess: () => {
      setIsInviteDialogOpen(false)
      reset()
      void queryClient.invalidateQueries({
        queryKey: ['workspace-invitations', workspaceId],
      })
    },
    onError: (error) => {
      showErrorToast('Could not send invitation.', error)
    },
  })

  if (!canInviteMembers) return null

  return (
    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
      <DialogTrigger asChild>
        <Button type="button">Invite member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Invite a teammate to this workspace. New invites are created with
            the member role by default.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={handleSubmit((values) => {
            inviteMutation.reset()
            inviteMutation.mutate(values)
          })}
        >
          <FieldGroup>
            <Field data-invalid={errors.name ? 'true' : undefined}>
              <FieldLabel htmlFor="invite-name">Name</FieldLabel>
              <Input
                id="invite-name"
                placeholder="Ada Lovelace"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={errors.email ? 'true' : undefined}>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                placeholder="ada@example.com"
                type="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              loading={inviteMutation.isPending}
              type="submit"
              className="w-full sm:w-auto"
            >
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MembersPageClient({
  workspaceId,
  workspaceName,
  workspaceSlug,
  currentRole,
}: MembersPageClientProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: MemberTab = isMemberTab(tabParam) ? tabParam : 'members'

  const getTabHref = (tab: MemberTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const canManageMembers = currentRole === 'owner' || currentRole === 'admin'
  const canInviteMembers = canManageMembers
  const canManageInvitations = canManageMembers

  useEffect(() => {
    let cancelled = false

    const setActiveWorkspace = async () => {
      const { error } = await authClient.organization.setActive({
        organizationId: workspaceId,
      })
      if (error && !cancelled) {
        console.error(error.message ?? 'Could not set active workspace')
      }
    }

    void setActiveWorkspace()

    return () => {
      cancelled = true
    }
  }, [workspaceId])

  return (
    <PageContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/app/${workspaceSlug}`}>Workspace Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Members</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Members"
        description={
          <>
            Manage members and invitations for <code>{workspaceName}</code> (
            <code>{workspaceSlug}</code>).
          </>
        }
        extraAction={
          <InviteMemberDialog
            workspaceId={workspaceId}
            canInviteMembers={canInviteMembers}
          />
        }
      />

      <Tabs className="gap-8" value={activeTab}>
        <TabsList variant="line">
          <TabsTrigger asChild value="members">
            <Link href={getTabHref('members')}>Members</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="invitations">
            <Link href={getTabHref('invitations')}>Invitations</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent className="min-w-0 pt-2" value="members">
          <MembersTabContent
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            canManageMembers={canManageMembers}
          />
        </TabsContent>

        <TabsContent className="min-w-0 pt-2" value="invitations">
          <InvitationsTabContent
            workspaceId={workspaceId}
            canManageInvitations={canManageInvitations}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
