import { Placeholder } from '@/components/Placeholder';

export default function OrdensServico() {
  return (
    <Placeholder
      titulo="Ordens de serviço"
      endpoint="GET /ordens-servico/kanban"
      itens={['Kanban com 9 etapas (Orçamento → Finalizado)', 'Prioridade com cor (Emergencial pulsante)', 'Detalhe: timeline, financeiro, histórico WhatsApp', 'Botões: mover etapa, registrar pagamento, enviar WhatsApp']}
    />
  );
}
