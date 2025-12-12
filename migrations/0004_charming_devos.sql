CREATE TYPE "public"."item_type" AS ENUM('material', 'product');--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" "item_type" NOT NULL,
	"unit" text NOT NULL,
	"purchase_price" numeric(14, 2),
	"sell_price" numeric(14, 2),
	"min_quantity" numeric(14, 3) DEFAULT '0' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "items_code_unique" UNIQUE("code")
);
