import { TelaChapas } from '@/components/projetos/TelaChapas';
import { PODE } from '@/lib/permissoes';
import { obterSessao } from '@/lib/servidor';

export default async function PaginaChapas() {
  const s = await obterSessao();
  const perfil = s?.sessao.perfil ?? 'COMERCIAL';
  return <TelaChapas podeEditar={PODE.editarChapas(perfil)} podeAjustarEstoque={['ADMIN', 'GESTOR', 'MARCENEIRO'].includes(perfil)} />;
}
