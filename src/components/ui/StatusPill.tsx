type PillTone = "ok" | "warn" | "mute";

const toneClasses: Record<PillTone, string> = {
  ok: "bg-success-soft text-success",
  warn: "bg-danger-soft text-danger",
  mute: "bg-sand text-ink-2",
};

export function StatusPill({ tone, children }: { tone: PillTone; children: string }) {
  return (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
