CREATE TABLE "user_workspace_appearance" (
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"accent_color" text DEFAULT 'blue' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_workspace_appearance_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "user_workspace_appearance" ADD CONSTRAINT "user_workspace_appearance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_workspace_appearance" ADD CONSTRAINT "user_workspace_appearance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "user_workspace_appearance_user_idx" ON "user_workspace_appearance" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_workspace_appearance_org_idx" ON "user_workspace_appearance" USING btree ("organization_id");
