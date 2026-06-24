'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import { AccountSettings } from './account-settings'
import { AppearanceSettings } from './appearance-settings'
import { SecuritySettings } from './security-settings'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const settingsTabs = ['account', 'appearance', 'security'] as const
type SettingsTab = (typeof settingsTabs)[number]

function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && settingsTabs.includes(value as SettingsTab)
}

export function SettingsClient() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: SettingsTab = isSettingsTab(tabParam) ? tabParam : 'account'

  const getTabHref = (tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  return (
    <PageContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/app">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Settings"
        description="Manage your profile, security, and preferences."
      />

      <Tabs className="gap-8" value={activeTab}>
        <TabsList variant="line">
          <TabsTrigger asChild value="account">
            <Link href={getTabHref('account')}>Account</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="appearance">
            <Link href={getTabHref('appearance')}>Appearance</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="security">
            <Link href={getTabHref('security')}>Security</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent className="min-w-0 pt-2" value="account">
          <AccountSettings />
        </TabsContent>
        <TabsContent className="min-w-0 pt-2" value="appearance">
          <AppearanceSettings />
        </TabsContent>
        <TabsContent className="min-w-0 pt-2" value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
