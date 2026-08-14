export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-line rounded-md border border-dashed p-8 text-center">
      <p className="text-ink font-semibold">{title}</p>
      <p className="text-ink-3 mt-1.5 text-sm">{body}</p>
    </div>
  );
}
