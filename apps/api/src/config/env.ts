/**
 * Validação das variáveis de ambiente na subida da API.
 * Falha cedo se algo crítico estiver ausente ou inseguro em produção.
 */
export interface Ambiente {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGINS: string[];
  WHATSAPP_PROVIDER: 'link' | 'business_api';
  WHATSAPP_API_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
}

const PLACEHOLDERS = ['SECRET_KEY_AQUI', 'TOKEN_AQUI', 'API_KEY_AQUI', 'DB_PASSWORD'];

export function validarAmbiente(config: Record<string, unknown>): Ambiente {
  const erros: string[] = [];
  const texto = (k: string) => (typeof config[k] === 'string' ? (config[k] as string).trim() : '');
  const nodeEnv = (texto('NODE_ENV') || 'development') as Ambiente['NODE_ENV'];

  const databaseUrl = texto('DATABASE_URL');
  if (!databaseUrl) erros.push('DATABASE_URL é obrigatória.');

  const jwtSecret = texto('JWT_SECRET');
  if (!jwtSecret) erros.push('JWT_SECRET é obrigatória.');
  if (nodeEnv === 'production') {
    if (jwtSecret.length < 32) erros.push('JWT_SECRET deve ter ao menos 32 caracteres em produção.');
    if (PLACEHOLDERS.some((p) => jwtSecret.includes(p) || databaseUrl.includes(p))) {
      erros.push('Substitua os placeholders (SECRET_KEY_AQUI, DB_PASSWORD...) por valores reais em produção.');
    }
  }

  const provider = (texto('WHATSAPP_PROVIDER') || 'link') as Ambiente['WHATSAPP_PROVIDER'];
  if (!['link', 'business_api'].includes(provider)) erros.push('WHATSAPP_PROVIDER deve ser "link" ou "business_api".');

  if (erros.length) {
    throw new Error(`Configuração inválida:\n - ${erros.join('\n - ')}`);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: Number(texto('PORT') || 3001),
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: texto('JWT_EXPIRES_IN') || '8h',
    CORS_ORIGINS: (texto('CORS_ORIGINS') || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    WHATSAPP_PROVIDER: provider,
    WHATSAPP_API_TOKEN: texto('WHATSAPP_API_TOKEN') || undefined,
    WHATSAPP_PHONE_NUMBER_ID: texto('WHATSAPP_PHONE_NUMBER_ID') || undefined,
  };
}
