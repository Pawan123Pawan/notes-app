CREATE TABLE "user_appearance" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"base_color" text DEFAULT 'neutral' NOT NULL,
	"accent_color" text DEFAULT 'blue' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
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
	"issue_assigned_to_me" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_appearance" ADD CONSTRAINT "user_appearance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_appearance_user_idx" ON "user_appearance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_notification_settings_user_idx" ON "user_notification_settings" USING btree ("user_id");