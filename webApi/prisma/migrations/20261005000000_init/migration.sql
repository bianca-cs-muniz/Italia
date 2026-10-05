-- CreateTable
CREATE TABLE "lugares" (
    "id" UUID NOT NULL,
    "trecho" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "resumo" TEXT NOT NULL DEFAULT '',
    "preco" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "descricao" TEXT NOT NULL DEFAULT '',
    "destaques" TEXT[],
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lugares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" UUID NOT NULL,
    "lugarId" UUID,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "tipoMime" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "dados" BYTEA NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_marcados" (
    "itemId" TEXT NOT NULL,
    "marcadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_marcados_pkey" PRIMARY KEY ("itemId")
);

-- CreateIndex
CREATE INDEX "lugares_trecho_criadoEm_idx" ON "lugares"("trecho", "criadoEm");

-- CreateIndex
CREATE INDEX "fotos_lugarId_ordem_idx" ON "fotos"("lugarId", "ordem");

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "lugares"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Regras que o Prisma não descreve no schema, mas que o banco garante mesmo
-- para quem escreve direto nele (ver README, "Limites e proteções").

-- Só os tipos de imagem aceitos pela API.
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_tipoMime_check" CHECK ("tipoMime" IN ('image/jpeg', 'image/png', 'image/webp'));

-- Cada foto tem no máximo 2 MB (2097152 bytes).
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_dados_tamanho_check" CHECK (octet_length("dados") <= 2097152);
