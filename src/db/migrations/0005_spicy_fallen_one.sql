CREATE TABLE "workspace_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_notification" ADD CONSTRAINT "workspace_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_notification" ADD CONSTRAINT "workspace_notification_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_notification_user_idx" ON "workspace_notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_notification_org_idx" ON "workspace_notification" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workspace_notification_user_org_idx" ON "workspace_notification" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "workspace_notification_user_org_read_idx" ON "workspace_notification" USING btree ("user_id","organization_id","is_read");