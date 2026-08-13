type PillTone = "ok" | "warn" | "mute";

const toneClasses: Record<PillTone, string> = {
  ok: "bg-primary-soft text-primary-deep",
  warn: "bg-coral-soft text-coral",
  mute: "bg-lilac text-ink-3",
};

export function StatusPill({ tone, children }: { tone: PillTone; children: string }) {
  return (
    <span
      className={`rounded-pill inline-block px-[0.7em] py-[0.3em] font-mono text-[0.68rem] font-semibold whitespace-nowrap ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
