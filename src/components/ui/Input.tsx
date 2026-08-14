import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Input({ label, hint, id, name, className = "", ...props }: InputProps) {
  const inputId = id ?? name;
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5">
      <span className="text-ink-2 text-sm font-medium">{label}</span>
      <input
        id={inputId}
        name={name}
        {...props}
        className={`border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1 ${className}`}
      />
      {hint && <span className="text-ink-3 text-sm">{hint}</span>}
    </label>
  );
}
