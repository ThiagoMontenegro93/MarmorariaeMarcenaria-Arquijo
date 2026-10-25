-- CreateTable
CREATE TABLE "Medicao" (
    "id" UUID NOT NULL,
    "idLocal" VARCHAR(64) NOT NULL,
    "ordemServicoId" UUID NOT NULL,
    "usuarioId" UUID,
    "ambiente" VARCHAR(80) NOT NULL,
    "paredes" JSONB NOT NULL DEFAULT '[]',
    "observacoes" TEXT,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medidoEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Medicao_idLocal_key" ON "Medicao"("idLocal");

-- CreateIndex
CREATE INDEX "Medicao_ordemServicoId_medidoEm_idx" ON "Medicao"("ordemServicoId", "medidoEm");

-- AddForeignKey
ALTER TABLE "Medicao" ADD CONSTRAINT "Medicao_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicao" ADD CONSTRAINT "Medicao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
