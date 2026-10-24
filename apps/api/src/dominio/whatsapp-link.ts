import { EMPRESA } from './empresa';
import { ROTULO_ETAPA, type EtapaOS } from './os-fluxo';

/** Normaliza para o formato aceito pelo wa.me: só dígitos, com DDI 55. */
export function normalizarTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos;
  throw new Error(`Telefone inválido para WhatsApp: "${telefone}". Use DDD + número.`);
}

/** Link wa.me com mensagem pré-preenchida, sempre codificada com encodeURIComponent (RF19). */
export function gerarLinkWhatsApp(telefone: string, mensagem: string): string {
  return `https://wa.me/${normalizarTelefone(telefone)}?text=${encodeURIComponent(mensagem)}`;
}

export type ContextoMensagem =
  | { tipo: 'OS'; nomeCliente: string; numeroOs: number; ambiente: string; etapa: EtapaOS; prazo?: string }
  | { tipo: 'CLIENTE'; nomeCliente: string }
  | { tipo: 'LEAD_B2B'; nomeCliente: string; empresa: string }
  | { tipo: 'PROJETO'; nomeCliente: string; projeto: string }
  | { tipo: 'ORCAMENTO'; nomeCliente: string; projeto: string; valor: string };

/** Mensagens pré-preenchidas contextuais para cada card do sistema (Módulo G). */
export function mensagemContextual(ctx: ContextoMensagem): string {
  const assinatura = `\n\n${EMPRESA.nome}`;
  switch (ctx.tipo) {
    case 'OS':
      return (
        `Olá, ${ctx.nomeCliente}! Atualização da sua OS-${ctx.numeroOs} (${ctx.ambiente}): ` +
        `etapa atual "${ROTULO_ETAPA[ctx.etapa]}".` +
        (ctx.prazo ? ` Prazo de entrega: ${ctx.prazo}.` : '') +
        assinatura
      );
    case 'CLIENTE':
      return `Olá, ${ctx.nomeCliente}! Tudo bem? Aqui é da ${EMPRESA.nome}.`;
    case 'LEAD_B2B':
      return (
        `Olá, ${ctx.nomeCliente}! Recebemos o contato da ${ctx.empresa} pela nossa página de empresas. ` +
        `Podemos conversar sobre o seu projeto?` +
        assinatura
      );
    case 'PROJETO':
      return `Olá, ${ctx.nomeCliente}! Seguem novidades do projeto "${ctx.projeto}".${assinatura}`;
    case 'ORCAMENTO':
      return `Olá, ${ctx.nomeCliente}! Seu orçamento do projeto "${ctx.projeto}" ficou em ${ctx.valor}. Posso te explicar os detalhes?${assinatura}`;
  }
}
