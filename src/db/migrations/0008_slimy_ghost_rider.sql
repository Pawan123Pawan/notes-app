DROP TABLE "invitation" CASCADE;--> statement-breakpoint
DROP TABLE "member" CASCADE;--> statement-breakpoint
DROP TABLE "organization" CASCADE;--> statement-breakpoint
DROP TABLE "workspace_notification" CASCADE;--> statement-breakpoint
DROP TABLE "user_workspace_appearance" CASCADE;--> statement-breakpoint
DROP TABLE "user_workspace_notification_settings" CASCADE;--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "active_organization_id";