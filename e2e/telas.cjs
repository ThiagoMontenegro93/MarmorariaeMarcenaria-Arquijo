/**
 * Verificação ponta a ponta com Playwright (sem test runner): node e2e/telas.cjs
 * Pré-requisitos: API em :3001, web em :3000 (next start), banco com SEED_DEMO=true.
 * Variáveis: WEB_URL, E2E_EMAIL, E2E_SENHA.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL ?? 'admin@arquijo.com.br';
const SENHA = process.env.E2E_SENHA ?? 'SenhaLocal123';
const resultados = [];

async function passo(nome, fn) {
  const t = Date.now();
  try {
    await fn();
    resultados.push(`✔ ${nome} (${Date.now() - t} ms)`);
  } catch (e) {
    resultados.push(`✘ ${nome}: ${e.message}`);
    throw e;
  }
}

async function login(page, email = EMAIL, senha = SENHA) {
  await page.goto(`${WEB}/login`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/app/);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  try {
    await passo('rota interna sem login redireciona para /login', async () => {
      await page.goto(`${WEB}/app/os`);
      assert.match(page.url(), /\/login\?proximo=/);
    });

    await passo('login (cookie httpOnly) e dashboard', async () => {
      await login(page);
      const cookies = await context.cookies();
      const c = cookies.find((x) => x.name === 'arquijo_sessao');
      assert.ok(c, 'cookie de sessão ausente');
      assert.equal(c.httpOnly, true);
      assert.equal(await page.evaluate(() => document.cookie.includes('arquijo_sessao')), false);
      await page.goto(`${WEB}/app`);
      await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
      await page.getByText('Precisa de atenção hoje').waitFor();
      await page.getByText('Fluxo de caixa').waitFor();
    });

    await passo('mover OS no Kanban', async () => {
      await page.goto(`${WEB}/app/os`);
      const colunaOrc = page.locator('section[data-etapa="ORCAMENTO"]');
      const card = colunaOrc.locator('article').first();
      const codigo = (await card.locator('a').first().textContent()).trim();
      await card.getByRole('button', { name: /próxima etapa/ }).click();
      await page.locator(`section[data-etapa="APROVADO"] [data-testid="card-${codigo}"]`).waitFor();
      resultados.push(`  · ${codigo} ORCAMENTO → APROVADO`);
    });

    await passo('registrar pagamento no detalhe da OS', async () => {
      const card = page.locator('section[data-etapa="APROVADO"] article').first();
      await card.locator('a').first().click();
      await page.waitForURL(/\/app\/os\/[0-9a-f-]+$/);
      await page.getByRole('button', { name: /Gerar entrada 50%/ }).click();
      await page.getByText('Plano 50% + saldo gerado.').waitFor();
      await page.getByRole('button', { name: 'Confirmar' }).first().click();
      await page.getByText('Pagamento confirmado.').waitFor();
      assert.equal((await page.getByTestId('status-financeiro').textContent()).trim(), 'PARCIAL');
    });

    await passo('calcular chapas com plano de corte em SVG', async () => {
      await page.goto(`${WEB}/app/projetos`);
      await page.getByText('Cozinha demonstração').first().click();
      await page.waitForURL(/\/app\/projetos\/[0-9a-f-]+$/);
      await page.getByRole('button', { name: 'Calcular chapas necessárias' }).click();
      await page.getByTestId('resultado-calculo').waitFor();
      const svgs = await page.getByTestId('plano-corte').count();
      const total = (await page.getByTestId('total-chapas').textContent()).trim();
      assert.ok(svgs >= 2, `esperava >= 2 planos, veio ${svgs}`);
      resultados.push(`  · ${total} chapas, ${svgs} planos SVG, valor ${(await page.getByTestId('valor-final').textContent()).trim()}`);
    });

    await passo('menus por perfil: marceneiro não vê Dashboard nem Leads', async () => {
      const ctx2 = await browser.newContext();
      const p2 = await ctx2.newPage();
      await login(p2, 'marceneiro@arquijo.com.br', SENHA);
      const nav = p2.getByRole('navigation', { name: 'Sistema' });
      assert.equal(await nav.getByRole('link', { name: 'Dashboard' }).count(), 0);
      assert.equal(await nav.getByRole('link', { name: 'Leads B2B' }).count(), 0);
      await p2.goto(`${WEB}/app/leads`);
      assert.match(p2.url(), /\/app\/os$/);
      await ctx2.close();
    });

    await passo('logout', async () => {
      await page.getByRole('button', { name: 'Sair' }).click();
      await page.waitForURL(/\/login/);
      await page.goto(`${WEB}/app`);
      assert.match(page.url(), /\/login/);
    });
  } finally {
    console.log(resultados.join('\n'));
    await browser.close();
  }
})().catch(() => process.exit(1));
