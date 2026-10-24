/** Dados oficiais (Google Meu Negócio) — espelha apps/api/src/dominio/empresa.ts. */
export const EMPRESA = {
  nome: 'Arquijo Marmoraria e Marcenaria',
  endereco: 'R. Mupia, Rio de Janeiro - RJ, 21220-320',
  telefone: '+55 21 98450-3570',
  whatsapp: '5521984503570',
  googlePlaceId: '604870052287207',
  coordenadas: { lat: -22.848012, lng: -43.318048 },
  horario: 'Segunda a Domingo, 08:00-20:00',
  linkGoogle: 'https://share.google/MWgcjdhnah94mEqGM',
  linkMapa: 'https://www.google.com/maps/search/?api=1&query=-22.848012,-43.318048',
  linkRota: 'https://www.google.com/maps/dir/?api=1&destination=-22.848012,-43.318048',
  areaAtendimento: 'Toda a capital, Baixada Fluminense e Niterói',
} as const;

/** Link wa.me com mensagem codificada (RF19). */
export function linkWhatsApp(mensagem = 'Olá'): string {
  return `https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
