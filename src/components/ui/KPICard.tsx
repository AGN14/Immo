import type { ReactNode } from "react";

export function KPICard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: ReactNode;
}) {
  return (
    <div className="border-line bg-surface rounded-md border p-5">
      <div className="flex items-center gap-3">
        <span className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-[10px]">
          {icon}
        </span>
        <span className="text-ink-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
          {label}
        </span>
      </div>
      <div className="text-ink mt-3 font-mono text-[1.5rem] font-semibold">{value}</div>
      {caption && <div className="text-ink-3 mt-1 text-[0.78rem]">{caption}</div>}
    </div>
  );
}
