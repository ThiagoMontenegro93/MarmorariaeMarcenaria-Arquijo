import { EditorProjeto } from '@/components/projetos/EditorProjeto';

export default async function PaginaProjeto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorProjeto id={id} />;
}
