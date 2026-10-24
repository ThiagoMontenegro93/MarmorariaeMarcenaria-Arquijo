import { KanbanOs } from '@/components/os/KanbanOs';
import { PODE } from '@/lib/permissoes';
import { obterSessao } from '@/lib/servidor';

export default async function PaginaOs() {
  const s = await obterSessao();
  return <KanbanOs podeCriar={!!s && PODE.criarOs(s.sessao.perfil)} />;
}
