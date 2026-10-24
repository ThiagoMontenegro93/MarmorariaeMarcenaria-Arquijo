import { Placeholder } from '@/components/Placeholder';

export default function Dashboard() {
  return (
    <Placeholder
      titulo="Dashboard"
      endpoint="GET /dashboard"
      itens={['KPIs: orçamentos no mês, OS em produção, a receber, entregas no prazo', 'Funil orçamento → recebimento', 'Gantt de prazos por prioridade', 'Precisa de atenção hoje', 'Fluxo de caixa (PIX / cartão / parcelado)', 'Card Google Meu Negócio']}
    />
  );
}
