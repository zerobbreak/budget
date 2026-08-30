-- Better Auth 1.7 requires issuer on account rows.
ALTER TABLE "AuthAccount" ADD COLUMN "issuer" TEXT NOT NULL DEFAULT 'local:credential';

ALTER TABLE "AuthAccount" ALTER COLUMN "issuer" DROP DEFAULT;

CREATE UNIQUE INDEX "AuthAccount_issuer_accountId_key" ON "AuthAccount"("issuer", "accountId");
