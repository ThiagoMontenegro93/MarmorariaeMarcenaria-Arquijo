import { DetalheOs } from '@/components/os/DetalheOs';
import { PODE } from '@/lib/permissoes';
import { obterSessao } from '@/lib/servidor';

/** Next 15: params é uma Promise. */
export default async function PaginaDetalheOs({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await obterSessao();
  const perfil = s?.sessao.perfil ?? 'MARCENEIRO';
  return <DetalheOs id={id} podeFinanceiro={PODE.financeiro(perfil)} />;
}
