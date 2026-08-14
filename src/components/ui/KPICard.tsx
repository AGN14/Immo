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
      <div className="flex items-center gap-2.5">
        <span className="text-ink-3">{icon}</span>
        <span className="text-ink-3 text-sm font-medium">{label}</span>
      </div>
      <div className="text-primary mt-3 text-3xl font-semibold" data-numeric>
        {value}
      </div>
      {caption && <div className="text-ink-3 mt-1 text-sm">{caption}</div>}
    </div>
  );
}
