CREATE TABLE "user_workspace_notification_settings" (
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"auth_new_login_detected" boolean DEFAULT true NOT NULL,
	"auth_password_changed" boolean DEFAULT true NOT NULL,
	"auth_two_factor_status_changed" boolean DEFAULT true NOT NULL,
	"auth_account_deletion_initiated" boolean DEFAULT true NOT NULL,
	"workspace_invitation_received" boolean DEFAULT true NOT NULL,
	"workspace_invitation_response" boolean DEFAULT true NOT NULL,
	"workspace_member_joined" boolean DEFAULT true NOT NULL,
	"workspace_member_left" boolean DEFAULT true NOT NULL,
	"workspace_member_removed" boolean DEFAULT true NOT NULL,
	"workspace_role_changed" boolean DEFAULT true NOT NULL,
	"workspace_settings_updated" boolean DEFAULT true NOT NULL,
	"workspace_deleted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_workspace_notification_settings_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "user_workspace_notification_settings" ADD CONSTRAINT "user_workspace_notification_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_workspace_notification_settings" ADD CONSTRAINT "user_workspace_notification_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "user_workspace_notification_settings_user_idx" ON "user_workspace_notification_settings" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_workspace_notification_settings_org_idx" ON "user_workspace_notification_settings" USING btree ("organization_id");
