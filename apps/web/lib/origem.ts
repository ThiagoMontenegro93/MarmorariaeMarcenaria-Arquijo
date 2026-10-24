/**
 * Proteção CSRF para rotas que usam o cookie de sessão: além de SameSite=Strict,
 * exige que o Origin (ou Referer) de requisições que alteram dados seja o próprio site.
 */
export function origemPermitida(req: Request): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const origem = req.headers.get('origin') ?? req.headers.get('referer');
  if (!host || !origem) return false;
  try {
    return new URL(origem).host === host;
  } catch {
    return false;
  }
}
