-- Safely replace enum type for documents.status
-- 1. Create new enum type
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status_new') THEN
		EXECUTE 'CREATE TYPE "public"."document_status_new" AS ENUM (''completed'', ''cancelled'')';
	END IF;
END$$;
-- 2. Drop default before altering type
ALTER TABLE "documents" ALTER COLUMN "status" DROP DEFAULT;
-- 3. Alter column to use new enum
ALTER TABLE "documents" ALTER COLUMN "status" TYPE "public"."document_status_new" USING (status::text::"public"."document_status_new");
-- 4. Drop old enum type (now unused)
DROP TYPE "public"."document_status";
-- 5. Rename new enum to canonical name
ALTER TYPE "public"."document_status_new" RENAME TO "document_status";