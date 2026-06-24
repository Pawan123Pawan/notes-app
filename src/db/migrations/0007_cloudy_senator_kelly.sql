CREATE TABLE "user_onboarding" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"tools_used" text,
	"how_found_us" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_onboarding_completed_at_idx" ON "user_onboarding" USING btree ("completed_at");