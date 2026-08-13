"use client";

import Link from "next/link";
import { useRef, type MouseEvent, type ReactNode } from "react";

type Variant = "primary" | "ghost" | "on-dark" | "outline-on-dark";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-sm hover:bg-primary-hi hover:shadow-md",
  ghost: "bg-transparent text-ink border border-line hover:border-primary hover:text-primary",
  "on-dark": "bg-surface text-primary-deep",
  "outline-on-dark": "bg-transparent text-on-primary border border-white/40 hover:border-white",
};

const magneticVariants: Variant[] = ["primary", "on-dark"];

interface ButtonProps {
  href?: string;
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
}

export function Button({
  href,
  variant = "primary",
  block = false,
  children,
  type = "button",
  className = "",
}: ButtonProps) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const isMagnetic = magneticVariants.includes(variant);

  function handleMouseMove(e: MouseEvent) {
    if (!isMagnetic || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    ref.current.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
  }

  function handleMouseLeave() {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  }

  const classes = [
    "inline-flex items-center justify-center gap-[0.55em] whitespace-nowrap rounded-pill px-[1.6em] py-[0.9em] font-sans text-[0.96rem] font-bold no-underline transition-[transform,box-shadow,background-color,border-color] duration-200 [&_svg]:size-[1.05em] [&_svg]:shrink-0",
    variantClasses[variant],
    block ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link
        ref={ref}
        href={href}
        className={classes}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
