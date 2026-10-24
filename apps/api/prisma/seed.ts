/**
 * Seed com os dados do prompt mestre v4 (coleções, 8 modelos, combos, chapas padrão).
 * Idempotente (upsert por slug/chave única). Execute: npm run seed -w @arquijo/api
 *
 * Variáveis:
 *  SEED_ADMIN_EMAIL  (padrão admin@arquijo.com.br)
 *  SEED_ADMIN_SENHA  (obrigatória em produção; em dev, se ausente, gera uma aleatória e mostra no console)
 *  SEED_DEMO=true    cria dados de demonstração: usuários gestor/marceneiro/comercial (mesma senha do admin),
 *                    cliente, projeto (cut list do PDF), 3 OS em etapas diferentes, pagamentos e um lead B2B.
 *                    Use apenas em desenvolvimento/homologação.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

const COLECOES = [
  {
    slug: 'essencial',
    nome: 'Essencial',
    descricao: 'MDF Branco TX + Carvalho. Ideal para locação, primeiro apê e imobiliárias.',
    materiais: ['MDF Branco TX', 'MDF Carvalho'],
    precoAPartirDe: 3200,
    publicoAlvo: 'Locação, primeiro apartamento, imobiliárias',
    estilos: ['MINIMALISTA', 'MODERNO'],
    destaque: false,
    ordem: 1,
  },
  {
    slug: 'moderna',
    nome: 'Moderna',
    descricao: 'MDF Freijó, Grafite e Nogueira com painel ripado e LED. A mais vendida.',
    materiais: ['MDF Freijó', 'MDF Grafite', 'MDF Nogueira', 'Painel ripado', 'LED'],
    precoAPartirDe: 6500,
    publicoAlvo: 'Barra da Tijuca e Recreio',
    estilos: ['MODERNO', 'MINIMALISTA'],
    destaque: true,
    ordem: 2,
  },
  {
    slug: 'premium',
    nome: 'Premium',
    descricao:
      'MDF + madeira maciça Cumaru/Jequitibá + mármore Calacatta/Carrara/Travertino, Granito Preto São Gabriel, Quartzo Branco e Porcelanato.',
    materiais: ['MDF', 'Cumaru', 'Jequitibá', 'Mármore Calacatta', 'Mármore Carrara', 'Travertino', 'Granito Preto São Gabriel', 'Quartzo Branco', 'Porcelanato'],
    precoAPartirDe: 14000,
    publicoAlvo: 'Alto padrão — Leblon',
    estilos: ['CLASSICO', 'MODERNO'],
    destaque: false,
    ordem: 3,
  },
] as const;

const MODELOS: {
  slug: string; nome: string; ambiente: string; areaM2: number | null; materiais: string; preco: number | null;
  inclui: string[]; colecao: string; ordem: number;
}[] = [
  { slug: 'cozinha-ilha-central', nome: 'Cozinha com Ilha Central', ambiente: 'Cozinha', areaM2: 12, materiais: 'MDF Freijó + Quartzo', preco: 18500, inclui: ['Ilha central', 'Armários superiores e inferiores', 'Bancada em quartzo'], colecao: 'premium', ordem: 1 },
  { slug: 'cozinha-americana-bancada', nome: 'Cozinha Americana com Bancada', ambiente: 'Cozinha', areaM2: 8, materiais: 'MDF Branco + Granito', preco: 12400, inclui: ['Bancada americana em granito', 'Armários superiores e inferiores'], colecao: 'moderna', ordem: 2 },
  { slug: 'closet-casal-completo', nome: 'Closet Casal Completo', ambiente: 'Closet', areaM2: 6, materiais: 'MDF Grafite + Freijó', preco: 9800, inclui: ['Sapateira', 'Calceiro', 'Gavetas com corrediça telescópica'], colecao: 'moderna', ordem: 3 },
  { slug: 'closet-solteiro', nome: 'Closet Solteiro', ambiente: 'Closet', areaM2: 3, materiais: 'MDF Branco + Carvalho', preco: 4200, inclui: ['Cabideiros', 'Prateleiras', 'Gavetas'], colecao: 'essencial', ordem: 4 },
  { slug: 'painel-ripado-tv-75', nome: 'Painel Ripado TV até 75"', ambiente: 'Sala', areaM2: null, materiais: 'MDF Freijó ripado 2,5cm + nicho off white', preco: 2850, inclui: ['Painel ripado 2,5cm', 'Nicho off white'], colecao: 'moderna', ordem: 5 },
  { slug: 'home-office-planejado', nome: 'Home Office Planejado', ambiente: 'Escritório', areaM2: 4, materiais: 'MDF Nogueira', preco: 5600, inclui: ['Bancada de trabalho', 'Estante', 'Gaveteiro'], colecao: 'moderna', ordem: 6 },
  { slug: 'banheiro-planejado', nome: 'Banheiro Planejado', ambiente: 'Banheiro', areaM2: null, materiais: 'MDF naval + bancada porcelanato', preco: 3800, inclui: ['Gabinete em MDF naval', 'Bancada em porcelanato', 'Espelheira'], colecao: 'essencial', ordem: 7 },
  { slug: 'corporativo-recepcao-estacoes', nome: 'Corporativo — recepção e estações', ambiente: 'Corporativo', areaM2: null, materiais: 'Sob projeto', preco: null, inclui: ['Balcão de recepção', 'Estações de trabalho'], colecao: 'moderna', ordem: 8 },
];

/** Chapas padrão: 2750x1850 18mm R$ 280 e 2750x2100 15mm R$ 310 (prompt mestre). */
const CHAPAS = [
  { nome: 'MDF Freijó 18mm', material: 'MDF Freijó', larguraMm: 2750, alturaMm: 1850, espessuraMm: 18, custoUnitario: 280, qtdEstoque: 4 },
  { nome: 'MDF Grafite 18mm', material: 'MDF Grafite', larguraMm: 2750, alturaMm: 1850, espessuraMm: 18, custoUnitario: 280, qtdEstoque: 2 },
  { nome: 'MDF Nogueira 18mm', material: 'MDF Nogueira', larguraMm: 2750, alturaMm: 1850, espessuraMm: 18, custoUnitario: 280, qtdEstoque: 2 },
  { nome: 'MDF Carvalho 18mm', material: 'MDF Carvalho', larguraMm: 2750, alturaMm: 1850, espessuraMm: 18, custoUnitario: 280, qtdEstoque: 2 },
  { nome: 'MDF Branco TX 15mm', material: 'MDF Branco TX', larguraMm: 2750, alturaMm: 2100, espessuraMm: 15, custoUnitario: 310, qtdEstoque: 6 },
  { nome: 'MDF Naval 18mm', material: 'MDF Naval', larguraMm: 2750, alturaMm: 1850, espessuraMm: 18, custoUnitario: 280, qtdEstoque: 0 },
];

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@arquijo.com.br').toLowerCase();
  let senha = process.env.SEED_ADMIN_SENHA;
  if (!senha) {
    if (process.env.NODE_ENV === 'production') throw new Error('Defina SEED_ADMIN_SENHA em produção.');
    senha = randomBytes(12).toString('base64url');
    console.log(`⚠️  SEED_ADMIN_SENHA não definida. Senha gerada para ${email}: ${senha}  (troque após o primeiro acesso)`);
  }
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return { admin: existe, senha };
  const admin = await prisma.usuario.create({
    data: { nome: 'Administrador', email, perfil: 'ADMIN', senhaHash: await bcrypt.hash(senha, 12) },
  });
  return { admin, senha };
}

async function main() {
  const { admin, senha } = await seedAdmin();

  const colecoes = new Map<string, string>();
  for (const c of COLECOES) {
    const data = { ...c, materiais: [...c.materiais], estilos: [...c.estilos] };
    const r = await prisma.colecao.upsert({ where: { slug: c.slug }, create: data, update: data });
    colecoes.set(c.slug, r.id);
  }

  const modelos = new Map<string, string>();
  for (const m of MODELOS) {
    const { colecao, ...resto } = m;
    const data = {
      ...resto,
      sobConsulta: m.preco === null,
      prazoProducaoMinDias: 15,
      prazoProducaoMaxDias: 25,
      colecaoId: colecoes.get(colecao)!,
      descricao: `${m.nome} — ${m.materiais}. Medidas adaptáveis ao seu ambiente. Produção em 15 a 25 dias.`,
    };
    const r = await prisma.modelo.upsert({ where: { slug: m.slug }, create: data, update: data });
    modelos.set(m.slug, r.id);
  }

  const combos: { slug: string; nome: string; descricao: string; preco: number | null; descontoProgressivo?: Prisma.InputJsonValue; itens: [string, number][] }[] = [
    { slug: 'primeiro-ape', nome: 'Combo Primeiro Apê', descricao: 'Cozinha + closet solteiro', preco: 14900, itens: [['cozinha-americana-bancada', 1], ['closet-solteiro', 1]] },
    { slug: 'casal-premium', nome: 'Combo Casal Premium', descricao: 'Cozinha com ilha + closet casal + painel ripado', preco: 32000, itens: [['cozinha-ilha-central', 1], ['closet-casal-completo', 1], ['painel-ripado-tv-75', 1]] },
    {
      slug: 'imobiliaria',
      nome: 'Combo Imobiliária',
      descricao: '3 cozinhas iguais com desconto progressivo',
      preco: null,
      descontoProgressivo: [{ minUnidades: 3, descontoPct: 5 }, { minUnidades: 10, descontoPct: 10 }, { minUnidades: 20, descontoPct: 15 }, { minUnidades: 50, descontoPct: 20 }, { minUnidades: 100, descontoPct: 25 }],
      itens: [['cozinha-americana-bancada', 3]],
    },
  ];
  for (const c of combos) {
    const { itens, ...dados } = c;
    const combo = await prisma.combo.upsert({ where: { slug: c.slug }, create: dados, update: dados });
    await prisma.comboItem.deleteMany({ where: { comboId: combo.id } });
    await prisma.comboItem.createMany({ data: itens.map(([slug, quantidade]) => ({ comboId: combo.id, modeloId: modelos.get(slug)!, quantidade })) });
  }

  const chapas = new Map<string, string>();
  for (const c of CHAPAS) {
    const r = await prisma.chapa.upsert({
      where: { material_espessuraMm_larguraMm_alturaMm: { material: c.material, espessuraMm: c.espessuraMm, larguraMm: c.larguraMm, alturaMm: c.alturaMm } },
      create: c,
      update: { nome: c.nome, custoUnitario: c.custoUnitario },
    });
    chapas.set(c.material, r.id);
  }

  const etapas = ['Briefing e medição', 'Projeto 3D', 'Escolha de materiais', 'Produção na marcenaria', 'Instalação', 'Antes/depois + depoimento'].map((titulo, i) => ({
    ordem: i + 1,
    titulo,
    descricao: '',
    fotos: [] as string[],
  }));
  const obra = {
    titulo: 'Cozinha 12m² Barra da Tijuca',
    bairro: 'Barra da Tijuca',
    tipoCliente: 'RESIDENCIAL' as const,
    desafio: 'Integrar cozinha e sala com ilha central sem perder circulação.',
    solucao: 'Ilha com cooktop e bancada em quartzo, armários até o teto em MDF Freijó.',
    materiais: ['MDF', 'MDF Freijó', 'Quartzo Calacatta'],
    etapas: etapas as unknown as Prisma.InputJsonValue,
    publicado: true,
  };
  await prisma.obraPortfolio.upsert({ where: { slug: 'cozinha-12m2-barra-da-tijuca' }, create: { slug: 'cozinha-12m2-barra-da-tijuca', ...obra }, update: obra });

  if (process.env.SEED_DEMO === 'true') {
    await seedDemo(admin.id, senha, chapas);
  }

  console.log(`Seed concluído: ${COLECOES.length} coleções, ${MODELOS.length} modelos, ${combos.length} combos, ${CHAPAS.length} chapas.`);
}

const DIA = 86_400_000;

/** Dados de demonstração idempotentes (identificados por nomes/e-mails fixos). */
async function seedDemo(adminId: string, senha: string, chapas: Map<string, string>) {
  const hash = await bcrypt.hash(senha, 12);
  for (const [nome, email, perfil] of [
    ['Gestora Demo', 'gestor@arquijo.com.br', 'GESTOR'],
    ['Marceneiro Demo', 'marceneiro@arquijo.com.br', 'MARCENEIRO'],
    ['Comercial Demo', 'comercial@arquijo.com.br', 'COMERCIAL'],
  ] as const) {
    await prisma.usuario.upsert({ where: { email }, create: { nome, email, perfil, senhaHash: hash }, update: {} });
  }

  if (await prisma.cliente.findFirst({ where: { nome: 'Cliente Demonstração' } })) return;
  const agora = Date.now();
  const cliente = await prisma.cliente.create({
    data: { nome: 'Cliente Demonstração', telefone: '5521900000000', bairro: 'Barra da Tijuca', consentimentoLgpd: true, consentimentoEm: new Date(), consentimentoOrigem: 'seed' },
  });
  const cliente2 = await prisma.cliente.create({
    data: { nome: 'Marina Souza', telefone: '5521911112222', bairro: 'Recreio', consentimentoLgpd: true, consentimentoEm: new Date(), consentimentoOrigem: 'seed' },
  });
  const freijo = chapas.get('MDF Freijó')!;
  const branco = chapas.get('MDF Branco TX')!;
  const projeto = await prisma.projeto.create({
    data: {
      nome: 'Cozinha demonstração (cut list do PDF)',
      ambiente: 'Cozinha',
      clienteId: cliente.id,
      criadoPorId: adminId,
      horasMaoDeObra: 16,
      valorHora: 60,
      ferragens: [
        { nome: 'Dobradiça com amortecimento', quantidade: 4, precoUnitario: 18 },
        { nome: 'Corrediça telescópica', quantidade: 2, precoUnitario: 45 },
      ],
      pecas: {
        createMany: {
          data: [
            { nome: 'Porta', larguraMm: 700, alturaMm: 400, quantidade: 2, chapaId: freijo, veio: true },
            { nome: 'Lateral', larguraMm: 2100, alturaMm: 600, quantidade: 2, chapaId: freijo, veio: true },
            { nome: 'Prateleira', larguraMm: 560, alturaMm: 400, quantidade: 4, chapaId: branco, veio: false },
            { nome: 'Fundo', larguraMm: 2100, alturaMm: 580, quantidade: 1, chapaId: branco, veio: false },
          ],
        },
      },
    },
  });

  // OS em etapas diferentes para o Kanban e o dashboard.
  const etapas = ['ORCAMENTO', 'APROVADO', 'MEDICAO', 'COMPRA_MATERIAIS', 'PRODUCAO'] as const;
  const osDefs = [
    { clienteId: cliente.id, ambiente: 'Cozinha', status: 'ORCAMENTO' as const, prioridade: 'NORMAL' as const, prazo: 30, valor: 18500 },
    { clienteId: cliente2.id, ambiente: 'Closet casal', status: 'MEDICAO' as const, prioridade: 'ALTA' as const, prazo: 20, valor: 9800, medicaoHoje: true },
    { clienteId: cliente2.id, ambiente: 'Painel ripado TV', status: 'PRODUCAO' as const, prioridade: 'EMERGENCIAL' as const, prazo: -3, valor: 2850 },
  ];
  for (const d of osDefs) {
    const ate = etapas.indexOf(d.status as (typeof etapas)[number]);
    const os = await prisma.ordemServico.create({
      data: {
        clienteId: d.clienteId,
        projetoId: d.status === 'ORCAMENTO' ? projeto.id : undefined,
        ambiente: d.ambiente,
        status: d.status,
        prioridade: d.prioridade,
        prazoAcordado: new Date(agora + d.prazo * DIA),
        dataAprovacao: ate >= 1 ? new Date(agora - 10 * DIA) : undefined,
        dataMedicao: d.medicaoHoje ? new Date(agora) : undefined,
        valorTotal: d.valor,
        valorEntrada: d.valor / 2,
        historico: {
          create: etapas.slice(0, ate + 1).map((para, i) => ({
            de: i === 0 ? null : etapas[i - 1],
            para,
            entrouEm: new Date(agora - (10 - i * 2) * DIA),
            saiuEm: i < ate ? new Date(agora - (10 - (i + 1) * 2) * DIA) : null,
            usuarioId: adminId,
          })),
        },
      },
    });
    if (ate >= 1) {
      // entrada paga + saldo pendente
      await prisma.pagamento.createMany({
        data: [
          { ordemServicoId: os.id, tipo: 'ENTRADA', forma: 'PIX', valor: d.valor / 2, status: 'PAGO', pagoEm: new Date(agora - 2 * DIA), vencimento: new Date(agora - 2 * DIA), registradoPor: adminId },
          { ordemServicoId: os.id, tipo: 'PARCELA', forma: 'CARTAO', valor: d.valor / 2, vencimento: new Date(agora + d.prazo * DIA), registradoPor: adminId },
        ],
      });
      await prisma.ordemServico.update({ where: { id: os.id }, data: { valorRecebido: d.valor / 2, statusFinanceiro: 'PARCIAL' } });
    }
  }

  await prisma.leadB2B.create({
    data: {
      tipo: 'IMOBILIARIA', nomeEmpresa: 'Imobiliária Barra Demo', cnpj: '11222333000181', responsavel: 'Paula', whatsapp: '5521933334444',
      unidades: 20, bairro: 'Barra da Tijuca', orcamentoEstimado: 200000, precisaMedicao: true, consentimentoLgpd: true, origem: 'seed',
    },
  });
  console.log(`Demo: projeto ${projeto.id}, 3 OS, 1 lead, usuários gestor/marceneiro/comercial@arquijo.com.br`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
