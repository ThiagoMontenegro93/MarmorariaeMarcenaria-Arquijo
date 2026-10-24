import { Placeholder } from '@/components/Placeholder';

export default function Chapas() {
  return (
    <Placeholder
      titulo="Chapas e cálculo"
      endpoint="GET /chapas · POST /projetos/:id/calcular"
      itens={['Cadastro de chapas e estoque', 'Cut list do projeto', 'Plano de corte 2D por chapa (sobras em cinza)', 'Prévia de custo e lista de compra']}
    />
  );
}
