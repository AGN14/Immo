import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Input({ label, hint, id, name, className = "", ...props }: InputProps) {
  const inputId = id ?? name;
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5 text-[0.88rem]">
      <span className="text-ink-2 font-medium">{label}</span>
      <input
        id={inputId}
        name={name}
        {...props}
        className={`border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-4 py-2.5 text-[0.95rem] focus-visible:outline-2 focus-visible:outline-offset-1 ${className}`}
      />
      {hint && <span className="text-ink-3 text-[0.78rem]">{hint}</span>}
    </label>
  );
}
