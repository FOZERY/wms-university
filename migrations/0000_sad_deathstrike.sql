CREATE TYPE "public"."role" AS ENUM('admin', 'storeManager', 'storekeeper');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid,
	"role" "role",
	"login" text NOT NULL,
	"password_hash" text NOT NULL,
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"middlename" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_login_unique" UNIQUE("login")
);
