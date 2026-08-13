export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-line rounded-md border border-dashed p-8 text-center">
      <p className="text-ink text-[0.95rem] font-semibold">{title}</p>
      <p className="text-ink-3 mt-2 text-[0.86rem]">{body}</p>
    </div>
  );
}
