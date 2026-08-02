-- Rename raw token columns to tokenHash (columns now store a SHA-256 hash,
-- never the raw token, so RENAME preserves intent without any data loss).
ALTER TABLE "verification_tokens" RENAME COLUMN "token" TO "tokenHash";
ALTER TABLE "password_reset_tokens" RENAME COLUMN "token" TO "tokenHash";
