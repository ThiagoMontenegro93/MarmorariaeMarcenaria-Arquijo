-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'GESTOR', 'MARCENEIRO', 'COMERCIAL');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('RESIDENCIAL', 'IMOBILIARIA', 'CONSTRUTORA', 'EMPREITEIRA', 'CORPORATIVO');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('ORCAMENTO', 'APROVADO', 'MEDICAO', 'COMPRA_MATERIAIS', 'PRODUCAO', 'INSTALACAO', 'ENTREGA', 'RECEBIMENTO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "PrioridadeOS" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'EMERGENCIAL');

-- CreateEnum
CREATE TYPE "StatusFinanceiroOS" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO');

-- CreateEnum
CREATE TYPE "TipoPagamento" AS ENUM ('ENTRADA', 'PARCELA');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'CARTAO', 'PARCELADO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('RASCUNHO', 'CALCULADO', 'EM_ORCAMENTO', 'APROVADO');

-- CreateEnum
CREATE TYPE "DirecaoMensagem" AS ENUM ('ENVIADA', 'RECEBIDA');

-- CreateEnum
CREATE TYPE "CanalWhatsapp" AS ENUM ('LINK_WA_ME', 'BUSINESS_API');

-- CreateEnum
CREATE TYPE "StatusMensagem" AS ENUM ('GERADA', 'ENVIADA', 'FALHA');

-- CreateEnum
CREATE TYPE "TipoEmpresaB2B" AS ENUM ('IMOBILIARIA', 'CONSTRUTORA', 'EMPREITEIRA');

-- CreateEnum
CREATE TYPE "StatusLeadB2B" AS ENUM ('NOVO', 'EM_CONTATO', 'PROPOSTA_ENVIADA', 'FECHADO', 'PERDIDO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'MARCENEIRO',
    "telefone" VARCHAR(20),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLoginEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(180),
    "documento" VARCHAR(18),
    "endereco" VARCHAR(255),
    "bairro" VARCHAR(80),
    "cidade" VARCHAR(80) NOT NULL DEFAULT 'Rio de Janeiro',
    "tipo" "TipoCliente" NOT NULL DEFAULT 'RESIDENCIAL',
    "consentimentoLgpd" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoEm" TIMESTAMP(3),
    "consentimentoOrigem" VARCHAR(60),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapa" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "material" VARCHAR(80) NOT NULL,
    "larguraMm" INTEGER NOT NULL,
    "alturaMm" INTEGER NOT NULL,
    "espessuraMm" INTEGER NOT NULL,
    "qtdEstoque" INTEGER NOT NULL DEFAULT 0,
    "custoUnitario" DECIMAL(12,2) NOT NULL,
    "fornecedor" VARCHAR(120),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Chapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "ambiente" VARCHAR(80),
    "status" "StatusProjeto" NOT NULL DEFAULT 'RASCUNHO',
    "clienteId" UUID,
    "modeloId" UUID,
    "criadoPorId" UUID,
    "espessuraSerraMm" INTEGER NOT NULL DEFAULT 4,
    "precoFitaPorMetro" DECIMAL(10,2) NOT NULL DEFAULT 2.5,
    "horasMaoDeObra" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "valorHora" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "margemPct" DECIMAL(5,2) NOT NULL DEFAULT 30,
    "ferragens" JSONB NOT NULL DEFAULT '[]',
    "resultadoCalculo" JSONB,
    "previaCusto" JSONB,
    "calculadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Peca" (
    "id" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "chapaId" UUID NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "larguraMm" INTEGER NOT NULL,
    "alturaMm" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "veio" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Peca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" UUID NOT NULL,
    "numero" SERIAL NOT NULL,
    "clienteId" UUID NOT NULL,
    "projetoId" UUID,
    "responsavelId" UUID,
    "ambiente" VARCHAR(80) NOT NULL,
    "descricao" TEXT,
    "status" "StatusOS" NOT NULL DEFAULT 'ORCAMENTO',
    "prioridade" "PrioridadeOS" NOT NULL DEFAULT 'NORMAL',
    "dataOrcamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAprovacao" TIMESTAMP(3),
    "dataMedicao" TIMESTAMP(3),
    "prazoAcordado" TIMESTAMP(3),
    "prazoReal" TIMESTAMP(3),
    "valorTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorEntrada" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorRecebido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "statusFinanceiro" "StatusFinanceiroOS" NOT NULL DEFAULT 'PENDENTE',
    "materiais" JSONB,
    "fotosAntes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotosDepois" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoEtapa" (
    "id" UUID NOT NULL,
    "ordemServicoId" UUID NOT NULL,
    "de" "StatusOS",
    "para" "StatusOS" NOT NULL,
    "entrouEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saiuEm" TIMESTAMP(3),
    "usuarioId" UUID,
    "observacao" TEXT,

    CONSTRAINT "HistoricoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" UUID NOT NULL,
    "ordemServicoId" UUID NOT NULL,
    "tipo" "TipoPagamento" NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "vencimento" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "observacao" TEXT,
    "registradoPor" UUID,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemWhatsapp" (
    "id" UUID NOT NULL,
    "ordemServicoId" UUID,
    "clienteId" UUID,
    "leadB2BId" UUID,
    "usuarioId" UUID,
    "telefone" VARCHAR(20) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "link" TEXT,
    "direcao" "DirecaoMensagem" NOT NULL DEFAULT 'ENVIADA',
    "canal" "CanalWhatsapp" NOT NULL DEFAULT 'LINK_WA_ME',
    "status" "StatusMensagem" NOT NULL DEFAULT 'GERADA',
    "contexto" VARCHAR(30),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemWhatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colecao" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "descricao" TEXT NOT NULL,
    "materiais" TEXT[],
    "precoAPartirDe" DECIMAL(12,2) NOT NULL,
    "publicoAlvo" VARCHAR(160),
    "estilos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modelo" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "ambiente" VARCHAR(60) NOT NULL,
    "areaM2" DECIMAL(6,2),
    "materiais" TEXT NOT NULL,
    "descricao" TEXT,
    "inclui" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preco" DECIMAL(12,2),
    "sobConsulta" BOOLEAN NOT NULL DEFAULT false,
    "prazoProducaoMinDias" INTEGER NOT NULL DEFAULT 15,
    "prazoProducaoMaxDias" INTEGER NOT NULL DEFAULT 25,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "colecaoId" UUID,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Modelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combo" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(12,2),
    "descontoProgressivo" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboItem" (
    "comboId" UUID NOT NULL,
    "modeloId" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("comboId","modeloId")
);

-- CreateTable
CREATE TABLE "LeadB2B" (
    "id" UUID NOT NULL,
    "tipo" "TipoEmpresaB2B" NOT NULL,
    "nomeEmpresa" VARCHAR(150) NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,
    "responsavel" VARCHAR(120) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "email" VARCHAR(180),
    "unidades" INTEGER NOT NULL,
    "prazoDesejado" VARCHAR(60),
    "bairro" VARCHAR(80),
    "orcamentoEstimado" DECIMAL(12,2),
    "precisaMedicao" BOOLEAN NOT NULL DEFAULT false,
    "mensagem" TEXT,
    "status" "StatusLeadB2B" NOT NULL DEFAULT 'NOVO',
    "consentimentoLgpd" BOOLEAN NOT NULL DEFAULT false,
    "origem" VARCHAR(60) NOT NULL DEFAULT 'site/empresas',
    "responsavelId" UUID,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "LeadB2B_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObraPortfolio" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "bairro" VARCHAR(80),
    "tipoCliente" "TipoCliente" NOT NULL DEFAULT 'RESIDENCIAL',
    "desafio" TEXT,
    "solucao" TEXT,
    "materiais" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "etapas" JSONB NOT NULL DEFAULT '[]',
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "depoimento" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "ObraPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "usuarioId" UUID,
    "acao" VARCHAR(60) NOT NULL,
    "entidade" VARCHAR(60) NOT NULL,
    "entidadeId" VARCHAR(64),
    "dados" JSONB,
    "ip" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_perfil_idx" ON "Usuario"("perfil");

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "Cliente"("nome");

-- CreateIndex
CREATE INDEX "Cliente_telefone_idx" ON "Cliente"("telefone");

-- CreateIndex
CREATE INDEX "Cliente_deletadoEm_idx" ON "Cliente"("deletadoEm");

-- CreateIndex
CREATE INDEX "Chapa_ativo_idx" ON "Chapa"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Chapa_material_espessuraMm_larguraMm_alturaMm_key" ON "Chapa"("material", "espessuraMm", "larguraMm", "alturaMm");

-- CreateIndex
CREATE INDEX "Projeto_clienteId_idx" ON "Projeto"("clienteId");

-- CreateIndex
CREATE INDEX "Projeto_status_idx" ON "Projeto"("status");

-- CreateIndex
CREATE INDEX "Peca_projetoId_idx" ON "Peca"("projetoId");

-- CreateIndex
CREATE INDEX "Peca_chapaId_idx" ON "Peca"("chapaId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_numero_key" ON "OrdemServico"("numero");

-- CreateIndex
CREATE INDEX "OrdemServico_status_prioridade_idx" ON "OrdemServico"("status", "prioridade");

-- CreateIndex
CREATE INDEX "OrdemServico_prazoAcordado_idx" ON "OrdemServico"("prazoAcordado");

-- CreateIndex
CREATE INDEX "OrdemServico_clienteId_idx" ON "OrdemServico"("clienteId");

-- CreateIndex
CREATE INDEX "OrdemServico_responsavelId_idx" ON "OrdemServico"("responsavelId");

-- CreateIndex
CREATE INDEX "OrdemServico_deletadoEm_idx" ON "OrdemServico"("deletadoEm");

-- CreateIndex
CREATE INDEX "HistoricoEtapa_ordemServicoId_entrouEm_idx" ON "HistoricoEtapa"("ordemServicoId", "entrouEm");

-- CreateIndex
CREATE INDEX "Pagamento_ordemServicoId_idx" ON "Pagamento"("ordemServicoId");

-- CreateIndex
CREATE INDEX "Pagamento_status_vencimento_idx" ON "Pagamento"("status", "vencimento");

-- CreateIndex
CREATE INDEX "Pagamento_pagoEm_idx" ON "Pagamento"("pagoEm");

-- CreateIndex
CREATE INDEX "MensagemWhatsapp_ordemServicoId_criadoEm_idx" ON "MensagemWhatsapp"("ordemServicoId", "criadoEm");

-- CreateIndex
CREATE INDEX "MensagemWhatsapp_clienteId_criadoEm_idx" ON "MensagemWhatsapp"("clienteId", "criadoEm");

-- CreateIndex
CREATE INDEX "MensagemWhatsapp_leadB2BId_idx" ON "MensagemWhatsapp"("leadB2BId");

-- CreateIndex
CREATE UNIQUE INDEX "Colecao_slug_key" ON "Colecao"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Modelo_slug_key" ON "Modelo"("slug");

-- CreateIndex
CREATE INDEX "Modelo_ambiente_idx" ON "Modelo"("ambiente");

-- CreateIndex
CREATE INDEX "Modelo_colecaoId_idx" ON "Modelo"("colecaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Combo_slug_key" ON "Combo"("slug");

-- CreateIndex
CREATE INDEX "LeadB2B_status_idx" ON "LeadB2B"("status");

-- CreateIndex
CREATE INDEX "LeadB2B_cnpj_idx" ON "LeadB2B"("cnpj");

-- CreateIndex
CREATE INDEX "LeadB2B_criadoEm_idx" ON "LeadB2B"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "ObraPortfolio_slug_key" ON "ObraPortfolio"("slug");

-- CreateIndex
CREATE INDEX "ObraPortfolio_publicado_idx" ON "ObraPortfolio"("publicado");

-- CreateIndex
CREATE INDEX "ObraPortfolio_tipoCliente_idx" ON "ObraPortfolio"("tipoCliente");

-- CreateIndex
CREATE INDEX "AuditLog_entidade_entidadeId_idx" ON "AuditLog"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "AuditLog_usuarioId_criadoEm_idx" ON "AuditLog"("usuarioId", "criadoEm");

-- CreateIndex
CREATE INDEX "AuditLog_criadoEm_idx" ON "AuditLog"("criadoEm");

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "Modelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Peca" ADD CONSTRAINT "Peca_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Peca" ADD CONSTRAINT "Peca_chapaId_fkey" FOREIGN KEY ("chapaId") REFERENCES "Chapa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoEtapa" ADD CONSTRAINT "HistoricoEtapa_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoEtapa" ADD CONSTRAINT "HistoricoEtapa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_registradoPor_fkey" FOREIGN KEY ("registradoPor") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemWhatsapp" ADD CONSTRAINT "MensagemWhatsapp_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemWhatsapp" ADD CONSTRAINT "MensagemWhatsapp_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemWhatsapp" ADD CONSTRAINT "MensagemWhatsapp_leadB2BId_fkey" FOREIGN KEY ("leadB2BId") REFERENCES "LeadB2B"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemWhatsapp" ADD CONSTRAINT "MensagemWhatsapp_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modelo" ADD CONSTRAINT "Modelo_colecaoId_fkey" FOREIGN KEY ("colecaoId") REFERENCES "Colecao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "Modelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadB2B" ADD CONSTRAINT "LeadB2B_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
