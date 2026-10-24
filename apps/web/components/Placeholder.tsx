export function Placeholder({ titulo, itens, endpoint }: { titulo: string; itens: string[]; endpoint: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-marca-escura">{titulo}</h1>
      <p className="mt-1 text-sm text-stone-500">
        Tela em construção — dados disponíveis na API em <code className="rounded bg-stone-100 px-1">{endpoint}</code>.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {itens.map((i) => (
          <li key={i} className="rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-600">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
