import type { Metadata } from 'next';
import { TelaMedicao } from '@/components/TelaMedicao';

export const metadata: Metadata = { title: 'Medição na obra' };

export default function PaginaMedicao() {
  return <TelaMedicao />;
}
