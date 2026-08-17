import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost" | "on-dark" | "outline-on-dark";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hi hover:-translate-y-0.5 shadow-cta",
  ghost: "border-line text-ink hover:border-ink-3 hover:-translate-y-0.5 border bg-transparent",
  "on-dark": "bg-on-primary text-panel hover:bg-on-primary/90 hover:-translate-y-0.5",
  "outline-on-dark":
    "border-panel-line text-on-primary border bg-transparent hover:border-on-primary hover:-translate-y-0.5",
};

interface ButtonProps {
  href?: string;
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold whitespace-nowrap no-underline transition-all duration-[250ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] [&_svg]:size-4 [&_svg]:shrink-0";

export function Button({
  href,
  variant = "primary",
  block = false,
  children,
  type = "button",
  className = "",
}: ButtonProps) {
  const classes = [base, variantClasses[variant], block ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes}>
      {children}
    </button>
  );
}
