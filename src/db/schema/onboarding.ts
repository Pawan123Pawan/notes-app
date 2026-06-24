import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { user } from './auth'

export const userOnboarding = pgTable(
  'user_onboarding',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    toolsUsed: text('tools_used'),
    howFoundUs: text('how_found_us').notNull(),
    completedAt: timestamp('completed_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('user_onboarding_completed_at_idx').on(table.completedAt)],
)
