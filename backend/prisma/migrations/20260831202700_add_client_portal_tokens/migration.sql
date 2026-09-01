-- CreateTable
CREATE TABLE "client_portal_tokens" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_portal_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_portal_tokens_token_key" ON "client_portal_tokens"("token");

-- CreateIndex
CREATE INDEX "client_portal_tokens_clientId_idx" ON "client_portal_tokens"("clientId");

-- CreateIndex
CREATE INDEX "client_portal_tokens_token_idx" ON "client_portal_tokens"("token");

-- AddForeignKey
ALTER TABLE "client_portal_tokens" ADD CONSTRAINT "client_portal_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
