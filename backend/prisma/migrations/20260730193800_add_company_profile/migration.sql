-- CreateTable
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "cnpj" TEXT,
    "estado" TEXT,
    "softwareConsultoria" BOOLEAN NOT NULL DEFAULT false,
    "softwareContabil" BOOLEAN NOT NULL DEFAULT false,
    "softwareFiscal" BOOLEAN NOT NULL DEFAULT false,
    "clientesHoje" INTEGER NOT NULL DEFAULT 0,
    "clientesAno" INTEGER NOT NULL DEFAULT 0,
    "funcionariosHoje" INTEGER NOT NULL DEFAULT 0,
    "funcionariosAno" INTEGER NOT NULL DEFAULT 0,
    "visaoEmpresa" TEXT,
    "maiorDesafio" TEXT,
    "compromisso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_userId_key" ON "company_profiles"("userId");

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
