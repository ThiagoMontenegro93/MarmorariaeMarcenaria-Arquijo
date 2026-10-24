/**
 * PWA offline (RNF03): salva medição sem rede (IndexedDB) e sincroniza quando a rede volta.
 * node e2e/medicao-offline.cjs   (API :3001, web :3000, SEED_DEMO=true)
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const SENHA = process.env.E2E_SENHA ?? 'SenhaLocal123';
// PNG 1x1 válido
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
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

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  let osId;
  let antes;
  try {
    await passo('login do marceneiro e tela de medição (celular)', async () => {
      await page.goto(`${WEB}/login`);
      await page.getByLabel('E-mail').fill('marceneiro@arquijo.com.br');
      await page.getByLabel('Senha').fill(SENHA);
      await page.getByRole('button', { name: 'Entrar' }).click();
      await page.waitForURL(/\/app\/os/);
      await page.goto(`${WEB}/app/medicao`);
      await page.getByRole('heading', { name: 'Medição na obra' }).waitFor();
      await page.waitForFunction(() => document.querySelectorAll('select[name="ordemServicoId"] option').length > 1);
    });

    await passo('service worker ativo e manifest disponível', async () => {
      await page.evaluate(() => navigator.serviceWorker.ready);
      const manifest = await (await page.request.get(`${WEB}/manifest.webmanifest`)).json();
      assert.equal(manifest.start_url, '/app/medicao');
      // dá tempo do SW guardar a tela e os scripts (mensagem "precache")
      await page.waitForFunction(async () => !!(await caches.match('/app/medicao')), null, { timeout: 10000 });
    });

    await passo('contagem de medições da OS antes (API)', async () => {
      osId = await page.locator('select[name="ordemServicoId"] option').nth(1).getAttribute('value');
      const r = await page.request.get(`${WEB}/api/proxy/ordens-servico/${osId}/medicoes`);
      assert.equal(r.status(), 200);
      antes = (await r.json()).length;
    });

    await passo('fica offline e reabre a tela pelo cache do service worker', async () => {
      await context.setOffline(true);
      const resp = await page.reload();
      assert.ok(resp && resp.fromServiceWorker(), 'a página offline deveria vir do service worker');
      const semRede = await page.evaluate(() => fetch('/api/proxy/ordens-servico').then(() => 'respondeu', () => 'falhou'));
      assert.equal(semRede, 'falhou', 'a API não deve responder offline (dados não ficam em cache)');
      await page.getByRole('heading', { name: 'Medição na obra' }).waitFor();
      await page.getByTestId('status-rede').filter({ hasText: 'Offline' }).waitFor();
      await page.waitForFunction(() => document.querySelectorAll('select[name="ordemServicoId"] option').length > 1); // lista do IndexedDB
    });

    await passo('salva medição offline com foto (IndexedDB)', async () => {
      await page.locator('select[name="ordemServicoId"]').selectOption(osId);
      await page.getByLabel('Ambiente').fill('Cozinha (offline)');
      await page.getByLabel('Largura da parede 1').fill('3200');
      await page.getByLabel('Altura da parede 1').fill('2700');
      await page.getByRole('button', { name: '+ Parede' }).click();
      await page.getByLabel('Largura da parede 2').fill('2400');
      await page.getByLabel('Altura da parede 2').fill('2700');
      await page.getByLabel('Observações').fill('Tomada a 1,10 m; ponto de água à esquerda.');
      await page.getByLabel('Fotos').setInputFiles({ name: 'parede.png', mimeType: 'image/png', buffer: PNG });
      await page.getByRole('button', { name: 'Salvar medição' }).click();
      await page.getByText('Será enviada quando a internet voltar').waitFor();
      const item = page.getByTestId('medicao-item').filter({ hasText: 'Cozinha (offline)' });
      assert.equal((await item.getByTestId('medicao-estado').textContent()).trim(), 'Pendente');
      const naFila = await page.evaluate(
        () =>
          new Promise((res) => {
            const req = indexedDB.open('arquijo-pwa');
            req.onsuccess = () => {
              const g = req.result.transaction('medicoes').objectStore('medicoes').getAll();
              g.onsuccess = () => res(g.result.filter((m) => m.estado === 'pendente').length);
            };
          }),
      );
      assert.equal(naFila, 1);
    });

    await passo('volta online e sincroniza automaticamente', async () => {
      await context.setOffline(false);
      const item = page.getByTestId('medicao-item').filter({ hasText: 'Cozinha (offline)' });
      await item.getByTestId('medicao-estado').filter({ hasText: 'Sincronizada' }).waitFor({ timeout: 15000 });
      const r = await page.request.get(`${WEB}/api/proxy/ordens-servico/${osId}/medicoes`);
      const lista = await r.json();
      assert.equal(lista.length, antes + 1);
      const nova = lista.find((m) => m.ambiente === 'Cozinha (offline)');
      assert.equal(nova.paredes.length, 2);
      assert.equal(nova.fotos.length, 1);
      const foto = await page.request.get(`${WEB}/api/proxy/arquivos/${nova.fotos[0]}`);
      assert.equal(foto.headers()['content-type'], 'image/png');
      resultados.push(`  · medições da OS: ${antes} → ${lista.length}; foto ${nova.fotos[0]}`);
    });
  } finally {
    console.log(resultados.join('\n'));
    await browser.close();
  }
})().catch(() => process.exit(1));
