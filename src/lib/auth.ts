import { createElement } from 'react'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import AuthAccountDeletionInitiatedEmail from '@/emails/auth-account-deletion-initiated'
import AuthNewLoginDetectedEmail from '@/emails/auth-new-login-detected'
import AuthPasswordChangedEmail from '@/emails/auth-password-changed'
import AuthTwoFactorStatusChangedEmail from '@/emails/auth-two-factor-status-changed'
import ResetPasswordEmail from '@/emails/reset-password'
import WelcomeEmail from '@/emails/welcome'
import WorkspaceDeletedEmail from '@/emails/workspace-deleted'
import WorkspaceInvitationReceivedEmail from '@/emails/workspace-invitation-received'
import WorkspaceInvitationResponseEmail from '@/emails/workspace-invitation-response'
import WorkspaceMemberJoinedEmail from '@/emails/workspace-member-joined'
import WorkspaceMemberLeftEmail from '@/emails/workspace-member-left'
import WorkspaceMemberRemovedEmail from '@/emails/workspace-member-removed'
import WorkspaceRoleChangedEmail from '@/emails/workspace-role-changed'
import WorkspaceSettingsUpdatedEmail from '@/emails/workspace-settings-updated'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { twoFactor, admin, organization } from 'better-auth/plugins'
import { Resend } from 'resend'
import {
  invitation,
  member,
  organization as organizationTable,
  user,
  workspaceNotification,
  userWorkspaceNotificationSettings,
  workspaceNotificationDefaults,
  type WorkspaceNotificationSettingKey,
  type WorkspaceNotificationType,
} from '@/db/schema'
import { env } from './env'

export const auth = betterAuth({
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: false,
        input: true,
      },
      timezone: {
        type: 'string',
        required: false,
        input: true,
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (!env.RESEND_API_KEY) {
        console.warn(
          '[auth] RESEND_API_KEY is not set; password reset email was not sent.',
        )
        return
      }
      const resend = new Resend(env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: env.RESEND_FROM,
        to: user.email,
        subject: 'Reset your password',
        react: createElement(ResetPasswordEmail, { user, url }),
      })
      if (error) {
        throw new Error(error.message)
      }
    },
  },
  socialProviders: {
    github:
      env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          }
        : undefined,
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const path = ctx.path
      const hookContext = ctx.context as {
        newSession?: {
          user: {
            id: string
            email: string
            name?: string | null
          }
          session?: {
            ipAddress?: string | null
            userAgent?: string | null
            activeOrganizationId?: string | null
          }
        }
        session?: {
          user: {
            id: string
            email: string
            name?: string | null
          }
        }
        returned?: Record<string, unknown>
        runInBackgroundOrAwait: (task: Promise<unknown>) => Promise<unknown>
      }
      const requestBody = (ctx as { body?: Record<string, unknown> }).body
      const returned = hookContext.returned ?? {}

      if (path.startsWith('/sign-up')) {
        const newSession = hookContext.newSession
        if (!newSession) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendWelcomeEmail({
            id: newSession.user.id,
            email: newSession.user.email,
            name: newSession.user.name,
          }),
        )
        return
      }

      if (path.startsWith('/sign-in')) {
        const newSession = hookContext.newSession
        if (!newSession) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          notifyUserSecurityEvent({
            userId: newSession.user.id,
            fallbackEmail: newSession.user.email,
            fallbackName: newSession.user.name,
            key: 'authNewLoginDetected',
            send: ({ workspace, userEmail, userName }) =>
              sendEmail({
                to: userEmail,
                subject: `New login detected for ${workspace.name}`,
                react: createElement(AuthNewLoginDetectedEmail, {
                  userName,
                  workspaceName: workspace.name,
                  device:
                    newSession.session?.userAgent?.trim() || 'Unknown device',
                  location: newSession.session?.ipAddress?.trim() || 'Unknown',
                  loginAt: new Date().toUTCString(),
                  securityUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${workspace.slug}/settings?tab=account`,
                }),
                idempotencyKey: `auth-new-login/${newSession.user.id}/${workspace.id}/${Date.now()}`,
              }),
          }),
        )
        return
      }

      if (path.includes('/change-password')) {
        const signedInUser = hookContext.session?.user
        if (!signedInUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          notifyUserSecurityEvent({
            userId: signedInUser.id,
            fallbackEmail: signedInUser.email,
            fallbackName: signedInUser.name,
            key: 'authPasswordChanged',
            send: ({ workspace, userEmail, userName }) =>
              sendEmail({
                to: userEmail,
                subject: `Password changed for ${workspace.name}`,
                react: createElement(AuthPasswordChangedEmail, {
                  userName,
                  workspaceName: workspace.name,
                  changedAt: new Date().toUTCString(),
                  securityUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${workspace.slug}/settings?tab=account`,
                }),
                idempotencyKey: `auth-password-changed/${signedInUser.id}/${workspace.id}/${Date.now()}`,
              }),
          }),
        )
        return
      }

      if (
        path.includes('/two-factor/enable') ||
        path.includes('/two-factor/disable')
      ) {
        const signedInUser = hookContext.session?.user
        if (!signedInUser) {
          return
        }

        const status = path.includes('/enable') ? 'enabled' : 'disabled'
        await hookContext.runInBackgroundOrAwait(
          notifyUserSecurityEvent({
            userId: signedInUser.id,
            fallbackEmail: signedInUser.email,
            fallbackName: signedInUser.name,
            key: 'authTwoFactorStatusChanged',
            send: ({ workspace, userEmail, userName }) =>
              sendEmail({
                to: userEmail,
                subject: `Two-factor authentication ${status}`,
                react: createElement(AuthTwoFactorStatusChangedEmail, {
                  userName,
                  workspaceName: workspace.name,
                  status,
                  changedAt: new Date().toUTCString(),
                  securityUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${workspace.slug}/settings?tab=account`,
                }),
                idempotencyKey: `auth-two-factor-${status}/${signedInUser.id}/${workspace.id}/${Date.now()}`,
              }),
          }),
        )
        return
      }

      if (path.includes('/delete-user')) {
        const signedInUser = hookContext.session?.user
        if (!signedInUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          notifyUserSecurityEvent({
            userId: signedInUser.id,
            fallbackEmail: signedInUser.email,
            fallbackName: signedInUser.name,
            key: 'authAccountDeletionInitiated',
            send: ({ workspace, userEmail, userName }) =>
              sendEmail({
                to: userEmail,
                subject: 'Account deletion initiated',
                react: createElement(AuthAccountDeletionInitiatedEmail, {
                  userName,
                  workspaceName: workspace.name,
                  requestedAt: new Date().toUTCString(),
                  supportUrl: `${env.NEXT_PUBLIC_APP_URL}/support`,
                }),
                idempotencyKey: `auth-account-deletion/${signedInUser.id}/${workspace.id}/${Date.now()}`,
              }),
          }),
        )
        return
      }

      if (
        path.includes('/organization/accept-invitation') ||
        path.includes('/accept-invitation')
      ) {
        const signedInUser = hookContext.session?.user
        const invitationId =
          (requestBody?.invitationId as string | undefined) ??
          (requestBody?.id as string | undefined) ??
          ((requestBody?.invitation as { id?: string } | undefined)?.id as
            | string
            | undefined) ??
          (returned?.invitationId as string | undefined)
        const organizationId =
          (requestBody?.organizationId as string | undefined) ??
          (returned?.organizationId as string | undefined) ??
          ((returned?.organization as { id?: string } | undefined)?.id as
            | string
            | undefined)
        if (!signedInUser || (!invitationId && !organizationId)) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendWorkspaceInvitationAcceptedNotifications({
            invitationId,
            organizationId,
            acceptedByUserId: signedInUser.id,
          }),
        )
        return
      }

      if (path.includes('/organization/remove-member')) {
        const organizationId = requestBody?.organizationId as string | undefined
        const memberIdOrEmail = requestBody?.memberIdOrEmail as
          | string
          | undefined
        const actorUser = hookContext.session?.user
        if (!organizationId || !memberIdOrEmail || !actorUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendWorkspaceMemberRemovedNotifications({
            organizationId,
            memberIdOrEmail,
            actorName: actorUser.name?.trim() || actorUser.email,
          }),
        )
        return
      }

      if (path.includes('/organization/leave')) {
        const organizationId = requestBody?.organizationId as string | undefined
        const actorUser = hookContext.session?.user
        if (!organizationId || !actorUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendWorkspaceMemberLeftNotifications({
            organizationId,
            actorUserId: actorUser.id,
            actorName: actorUser.name?.trim() || actorUser.email,
            actorEmail: actorUser.email,
          }),
        )
        return
      }

      if (path.includes('/organization/update-member-role')) {
        const organizationId = requestBody?.organizationId as string | undefined
        const memberId = requestBody?.memberId as string | undefined
        const nextRole = requestBody?.role as string | undefined
        const actorUser = hookContext.session?.user
        if (!organizationId || !memberId || !nextRole || !actorUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendWorkspaceRoleChangedNotifications({
            organizationId,
            memberId,
            newRole: nextRole,
            actorName: actorUser.name?.trim() || actorUser.email,
          }),
        )
        return
      }

      if (path.includes('/organization/update')) {
        const organizationId =
          (requestBody?.organizationId as string | undefined) ??
          (returned?.id as string | undefined)
        const actorUser = hookContext.session?.user
        if (!organizationId || !actorUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendWorkspaceBroadcastNotification({
            organizationId,
            key: 'workspaceSettingsUpdated',
            subjectPrefix: 'Workspace settings updated',
            actorName: actorUser.name?.trim() || actorUser.email,
            buildReact: ({ workspaceName, workspaceSlug, recipientName }) =>
              createElement(WorkspaceSettingsUpdatedEmail, {
                userName: recipientName,
                workspaceName,
                changedByName: actorUser.name?.trim() || actorUser.email,
                updatedAt: new Date().toUTCString(),
                summary: 'Workspace details were updated.',
                settingsUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${workspaceSlug}/settings`,
              }),
          }),
        )
        return
      }

      if (path.includes('/organization/delete')) {
        const organizationId =
          (requestBody?.organizationId as string | undefined) ??
          (returned?.id as string | undefined)
        const actorUser = hookContext.session?.user
        if (!organizationId || !actorUser) {
          return
        }

        await hookContext.runInBackgroundOrAwait(
          sendWorkspaceBroadcastNotification({
            organizationId,
            key: 'workspaceDeleted',
            subjectPrefix: 'Workspace deleted',
            actorName: actorUser.name?.trim() || actorUser.email,
            buildReact: ({ workspaceName, recipientName }) =>
              createElement(WorkspaceDeletedEmail, {
                userName: recipientName,
                workspaceName,
                deletedByName: actorUser.name?.trim() || actorUser.email,
                deletedAt: new Date().toUTCString(),
                supportUrl: `${env.NEXT_PUBLIC_APP_URL}/support`,
              }),
          }),
        )
      }
    }),
  },
  plugins: [
    nextCookies(),
    twoFactor({
      issuer: env.APP_NAME,
    }),
    admin(),
    organization({
      sendInvitationEmail: async ({
        id,
        email,
        role,
        organization,
        inviter,
      }) => {
        const inviterName = inviter.user.name?.trim() || inviter.user.email
        const invitationUrl = `${env.NEXT_PUBLIC_APP_URL}/app/accept-invitation?id=${id}`
        const task = sendWorkspaceInvitationReceivedNotification({
          invitationId: id,
          invitedEmail: email,
          role,
          organizationId: organization.id,
          organizationName: organization.name,
          inviterName,
          invitationUrl,
        })

        // Keep invitation API latency low by sending asynchronously.
        void task.catch((error) => {
          console.error(
            '[auth] Could not process invitation received delivery',
            error,
          )
        })
      },
    }),
  ],
})

async function sendWelcomeEmail(user: {
  id: string
  email: string
  name?: string | null
}) {
  if (!env.RESEND_API_KEY) {
    console.warn(
      '[auth] RESEND_API_KEY is not set; welcome email was not sent.',
    )
    return
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const { error } = await resend.emails.send(
    {
      from: env.RESEND_FROM,
      to: user.email,
      subject: 'Welcome to Micro SaaS Starter',
      react: createElement(WelcomeEmail, {
        user,
        appUrl: env.NEXT_PUBLIC_APP_URL,
      }),
    },
    { idempotencyKey: `welcome-email/${user.id}` },
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function sendEmail({
  to,
  subject,
  react,
  idempotencyKey,
}: {
  to: string
  subject: string
  react: ReturnType<typeof createElement>
  idempotencyKey?: string
}) {
  if (!env.RESEND_API_KEY) {
    return
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const { error } = await resend.emails.send(
    {
      from: env.RESEND_FROM,
      to,
      subject,
      react,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function getWorkspaceForUser(userId: string) {
  return db.query.member.findFirst({
    where: eq(member.userId, userId),
    with: {
      organization: true,
      user: true,
    },
  })
}

async function isNotificationEnabledForWorkspaceUser({
  userId,
  organizationId,
  key,
}: {
  userId: string
  organizationId: string
  key: WorkspaceNotificationSettingKey
}) {
  const settings = await db.query.userWorkspaceNotificationSettings.findFirst({
    where: and(
      eq(userWorkspaceNotificationSettings.userId, userId),
      eq(userWorkspaceNotificationSettings.organizationId, organizationId),
    ),
  })

  if (!settings) {
    return workspaceNotificationDefaults[key]
  }

  return settings[key]
}

async function notifyUserSecurityEvent({
  userId,
  fallbackEmail,
  fallbackName,
  key,
  send,
}: {
  userId: string
  fallbackEmail: string
  fallbackName?: string | null
  key: WorkspaceNotificationSettingKey
  send: (args: {
    workspace: { id: string; slug: string; name: string }
    userEmail: string
    userName?: string | null
  }) => Promise<void>
}) {
  try {
    const userWorkspace = await getWorkspaceForUser(userId)
    if (!userWorkspace?.organization) {
      return
    }

    const enabled = await isNotificationEnabledForWorkspaceUser({
      userId,
      organizationId: userWorkspace.organization.id,
      key,
    })
    if (!enabled) {
      return
    }

    const content = getSecurityNotificationContent({
      key,
      workspaceName: userWorkspace.organization.name,
    })
    await createWorkspaceNotificationRecord({
      userId,
      organizationId: userWorkspace.organization.id,
      title: content.title,
      body: content.body,
      type: content.type,
      actionUrl: content.actionUrl
        ? `/app/${userWorkspace.organization.slug}/${content.actionUrl}`
        : null,
    })

    await send({
      workspace: {
        id: userWorkspace.organization.id,
        slug: userWorkspace.organization.slug,
        name: userWorkspace.organization.name,
      },
      userEmail: fallbackEmail,
      userName: fallbackName,
    })
  } catch (error) {
    console.error(`[auth] Could not send ${key} email`, error)
  }
}

async function sendWorkspaceMemberLeftNotifications({
  organizationId,
  actorUserId,
  actorName,
  actorEmail,
}: {
  organizationId: string
  actorUserId: string
  actorName: string
  actorEmail: string
}) {
  try {
    const workspace = await db.query.organization.findFirst({
      where: eq(organizationTable.id, organizationId),
    })
    if (!workspace) {
      return
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: { user: true },
    })

    for (const workspaceMember of members) {
      if (
        !workspaceMember.user?.email ||
        workspaceMember.userId === actorUserId
      ) {
        continue
      }
      const enabled = await isNotificationEnabledForWorkspaceUser({
        userId: workspaceMember.userId,
        organizationId,
        key: 'workspaceMemberLeft',
      })
      if (!enabled) {
        continue
      }
      await createWorkspaceNotificationRecord({
        userId: workspaceMember.userId,
        organizationId,
        title: 'Member left workspace',
        body: `${actorName} left ${workspace.name}.`,
        type: 'warning',
        actionUrl: `/app/${workspace.slug}/members`,
      })
      await sendEmail({
        to: workspaceMember.user.email,
        subject: `A member left ${workspace.name}`,
        react: createElement(WorkspaceMemberLeftEmail, {
          userName: workspaceMember.user.name,
          workspaceName: workspace.name,
          memberName: actorName,
          memberEmail: actorEmail,
          leftAt: new Date().toUTCString(),
          membersUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${workspace.slug}/members`,
        }),
      })
    }
  } catch (error) {
    console.error('[auth] Could not send member left notifications', error)
  }
}

async function sendWorkspaceInvitationAcceptedNotifications({
  invitationId,
  organizationId,
  acceptedByUserId,
}: {
  invitationId?: string
  organizationId?: string
  acceptedByUserId: string
}) {
  try {
    const invite = invitationId
      ? await db.query.invitation.findFirst({
          where: eq(invitation.id, invitationId),
          with: {
            organization: true,
            user: true,
          },
        })
      : null

    const targetOrganizationId = invite?.organization?.id ?? organizationId
    if (!targetOrganizationId) {
      return
    }

    const workspace =
      invite?.organization ??
      (await db.query.organization.findFirst({
        where: eq(organizationTable.id, targetOrganizationId),
      }))
    if (!workspace) {
      return
    }

    const acceptedBy = await db.query.user.findFirst({
      where: eq(user.id, acceptedByUserId),
    })
    const acceptedName =
      acceptedBy?.name?.trim() || acceptedBy?.email || 'A user'

    if (invite?.user?.email) {
      const inviterEnabled = await isNotificationEnabledForWorkspaceUser({
        userId: invite.user.id,
        organizationId: invite.organization.id,
        key: 'workspaceInvitationResponse',
      })
      if (inviterEnabled) {
        await createWorkspaceNotificationRecord({
          userId: invite.user.id,
          organizationId: workspace.id,
          title: 'Invitation accepted',
          body: `${acceptedName} accepted your invitation to join ${workspace.name}.`,
          type: 'success',
          actionUrl: `/app/${workspace.slug}/members`,
        })

        await sendEmail({
          to: invite.user.email,
          subject: `Invitation accepted in ${workspace.name}`,
          react: createElement(WorkspaceInvitationResponseEmail, {
            userName: invite.user.name,
            workspaceName: workspace.name,
            inviteeEmail: invite.email,
            response: 'accepted',
            respondedAt: new Date().toUTCString(),
            membersUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${workspace.slug}/members`,
          }),
          idempotencyKey: invitationId
            ? `workspace-invitation-accepted/${invitationId}`
            : undefined,
        })
      }
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, workspace.id),
      with: { user: true },
    })
    for (const workspaceMember of members) {
      if (!workspaceMember.user?.email) {
        continue
      }
      const enabled = await isNotificationEnabledForWorkspaceUser({
        userId: workspaceMember.userId,
        organizationId: workspace.id,
        key: 'workspaceMemberJoined',
      })
      if (!enabled) {
        continue
      }
      await createWorkspaceNotificationRecord({
        userId: workspaceMember.userId,
        organizationId: workspace.id,
        title: 'New member joined',
        body: `${acceptedName} joined ${workspace.name}.`,
        type: 'info',
        actionUrl: `/app/${workspace.slug}/members`,
      })
      await sendEmail({
        to: workspaceMember.user.email,
        subject: `A member joined ${workspace.name}`,
        react: createElement(WorkspaceMemberJoinedEmail, {
          userName: workspaceMember.user.name,
          workspaceName: workspace.name,
          memberName: acceptedName,
          memberEmail: acceptedBy?.email ?? invite?.email ?? 'unknown',
          joinedAt: new Date().toUTCString(),
          membersUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${workspace.slug}/members`,
        }),
      })
    }
  } catch (error) {
    console.error(
      '[auth] Could not send invitation accepted notifications',
      error,
    )
  }
}

async function sendWorkspaceMemberRemovedNotifications({
  organizationId,
  memberIdOrEmail,
  actorName,
}: {
  organizationId: string
  memberIdOrEmail: string
  actorName: string
}) {
  try {
    const workspace = await db.query.organization.findFirst({
      where: eq(organizationTable.id, organizationId),
    })
    if (!workspace) {
      return
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: { user: true },
    })

    for (const workspaceMember of members) {
      if (!workspaceMember.user?.email) {
        continue
      }
      const enabled = await isNotificationEnabledForWorkspaceUser({
        userId: workspaceMember.userId,
        organizationId,
        key: 'workspaceMemberRemoved',
      })
      if (!enabled) {
        continue
      }
      await createWorkspaceNotificationRecord({
        userId: workspaceMember.userId,
        organizationId,
        title: 'Member removed',
        body: `${memberIdOrEmail} was removed from ${workspace.name} by ${actorName}.`,
        type: 'warning',
        actionUrl: `/app/${workspace.slug}/members`,
      })
      await sendEmail({
        to: workspaceMember.user.email,
        subject: `A member was removed from ${workspace.name}`,
        react: createElement(WorkspaceMemberRemovedEmail, {
          userName: workspaceMember.user.name,
          workspaceName: workspace.name,
          memberName: memberIdOrEmail,
          removedByName: actorName,
          removedAt: new Date().toUTCString(),
          membersUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${workspace.slug}/members`,
        }),
      })
    }
  } catch (error) {
    console.error('[auth] Could not send member removed notifications', error)
  }
}

async function sendWorkspaceRoleChangedNotifications({
  organizationId,
  memberId,
  newRole,
  actorName,
}: {
  organizationId: string
  memberId: string
  newRole: string
  actorName: string
}) {
  try {
    const targetMember = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.id, memberId),
      ),
      with: {
        user: true,
        organization: true,
      },
    })
    if (!targetMember?.user?.email || !targetMember.organization) {
      return
    }

    const enabled = await isNotificationEnabledForWorkspaceUser({
      userId: targetMember.userId,
      organizationId,
      key: 'workspaceRoleChanged',
    })
    if (!enabled) {
      return
    }

    await createWorkspaceNotificationRecord({
      userId: targetMember.userId,
      organizationId,
      title: 'Role updated',
      body: `Your role changed from ${targetMember.role} to ${newRole} in ${targetMember.organization.name}.`,
      type: 'info',
      actionUrl: `/app/${targetMember.organization.slug}/settings`,
    })

    await sendEmail({
      to: targetMember.user.email,
      subject: `Your role changed in ${targetMember.organization.name}`,
      react: createElement(WorkspaceRoleChangedEmail, {
        userName: targetMember.user.name,
        workspaceName: targetMember.organization.name,
        oldRole: targetMember.role,
        newRole,
        changedByName: actorName,
        changedAt: new Date().toUTCString(),
        settingsUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${targetMember.organization.slug}/settings`,
      }),
      idempotencyKey: `workspace-role-change/${organizationId}/${targetMember.userId}/${Date.now()}`,
    })
  } catch (error) {
    console.error('[auth] Could not send role changed notifications', error)
  }
}

async function sendWorkspaceBroadcastNotification({
  organizationId,
  key,
  subjectPrefix,
  actorName,
  buildReact,
}: {
  organizationId: string
  key: WorkspaceNotificationSettingKey
  subjectPrefix: string
  actorName: string
  buildReact: (args: {
    workspaceName: string
    workspaceSlug: string
    recipientName?: string | null
  }) => ReturnType<typeof createElement>
}) {
  try {
    const workspace = await db.query.organization.findFirst({
      where: eq(organizationTable.id, organizationId),
    })
    if (!workspace) {
      return
    }

    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: { user: true },
    })

    for (const workspaceMember of members) {
      if (!workspaceMember.user?.email) {
        continue
      }

      const enabled = await isNotificationEnabledForWorkspaceUser({
        userId: workspaceMember.userId,
        organizationId,
        key,
      })
      if (!enabled) {
        continue
      }

      const rowContent = buildWorkspaceNotificationContent({
        key,
        workspaceName: workspace.name,
        actorName,
      })
      await createWorkspaceNotificationRecord({
        userId: workspaceMember.userId,
        organizationId,
        title: rowContent.title,
        body: rowContent.body,
        type: rowContent.type,
        actionUrl: rowContent.actionUrl
          ? `/app/${workspace.slug}/${rowContent.actionUrl}`
          : null,
      })

      await sendEmail({
        to: workspaceMember.user.email,
        subject: `${subjectPrefix}: ${workspace.name}`,
        react: buildReact({
          workspaceName: workspace.name,
          workspaceSlug: workspace.slug,
          recipientName: workspaceMember.user.name,
        }),
      })
    }
  } catch (error) {
    console.error(`[auth] Could not send ${key} notifications`, error)
  }
}

async function sendWorkspaceInvitationReceivedNotification({
  invitationId,
  invitedEmail,
  role,
  organizationId,
  organizationName,
  inviterName,
  invitationUrl,
}: {
  invitationId: string
  invitedEmail: string
  role: string
  organizationId: string
  organizationName: string
  inviterName: string
  invitationUrl: string
}) {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, invitedEmail),
  })

  if (existingUser) {
    const enabled = await isNotificationEnabledForWorkspaceUser({
      userId: existingUser.id,
      organizationId,
      key: 'workspaceInvitationReceived',
    })

    if (enabled) {
      await createWorkspaceNotificationRecord({
        userId: existingUser.id,
        organizationId,
        title: 'Workspace invitation',
        body: `${inviterName} invited you to join ${organizationName} as ${role}.`,
        type: 'info',
        actionUrl: '/app/accept-invitation',
      })
    }
  }

  await sendEmail({
    to: invitedEmail,
    subject: `You're invited to join ${organizationName}`,
    react: createElement(WorkspaceInvitationReceivedEmail, {
      userName: invitedEmail.split('@')[0] ?? 'there',
      workspaceName: organizationName,
      inviterName,
      role,
      invitationUrl,
    }),
    idempotencyKey: `workspace-invitation-received/${invitationId}`,
  })
}

async function createWorkspaceNotificationRecord({
  userId,
  organizationId,
  title,
  body,
  type,
  actionUrl,
}: {
  userId: string
  organizationId: string
  title: string
  body: string
  type: WorkspaceNotificationType
  actionUrl?: string | null
}) {
  await db.insert(workspaceNotification).values({
    id: crypto.randomUUID(),
    userId,
    organizationId,
    title,
    body,
    type,
    actionUrl: actionUrl ?? null,
  })
}

function buildWorkspaceNotificationContent({
  key,
  workspaceName,
  actorName,
}: {
  key: WorkspaceNotificationSettingKey
  workspaceName: string
  actorName: string
}) {
  switch (key) {
    case 'workspaceSettingsUpdated':
      return {
        title: 'Workspace settings updated',
        body: `${actorName} updated settings in ${workspaceName}.`,
        type: 'info' as const,
        actionUrl: 'settings',
      }
    case 'workspaceDeleted':
      return {
        title: 'Workspace deleted',
        body: `${actorName} deleted ${workspaceName}.`,
        type: 'error' as const,
        actionUrl: null,
      }
    default:
      return {
        title: 'Workspace update',
        body: `${workspaceName} has a new update.`,
        type: 'info' as const,
        actionUrl: null,
      }
  }
}

function getSecurityNotificationContent({
  key,
  workspaceName,
}: {
  key: WorkspaceNotificationSettingKey
  workspaceName: string
}) {
  switch (key) {
    case 'authNewLoginDetected':
      return {
        title: 'New login detected',
        body: `A new sign-in was detected for ${workspaceName}.`,
        type: 'warning' as const,
        actionUrl: 'settings?tab=account',
      }
    case 'authPasswordChanged':
      return {
        title: 'Password changed',
        body: `Your password was changed for ${workspaceName}.`,
        type: 'info' as const,
        actionUrl: 'settings?tab=account',
      }
    case 'authTwoFactorStatusChanged':
      return {
        title: 'Two-factor authentication updated',
        body: `Two-factor authentication settings changed for ${workspaceName}.`,
        type: 'info' as const,
        actionUrl: 'settings?tab=account',
      }
    case 'authAccountDeletionInitiated':
      return {
        title: 'Account deletion initiated',
        body: 'Account deletion was requested. Contact support if this was unexpected.',
        type: 'error' as const,
        actionUrl: null,
      }
    default:
      return {
        title: 'Account security update',
        body: `A security event occurred for ${workspaceName}.`,
        type: 'info' as const,
        actionUrl: null,
      }
  }
}
