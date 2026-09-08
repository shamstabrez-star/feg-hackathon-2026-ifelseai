export function PagePlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <section className="rounded-md bg-surface p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{note}</p>
    </section>
  );
}
