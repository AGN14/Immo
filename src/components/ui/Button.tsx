"use client";

import Link from "next/link";
import { useRef, type MouseEvent, type ReactNode } from "react";

type Variant = "primary" | "ghost" | "on-dark" | "outline-on-dark";

const variantConfig: Record<Variant, { classes: string; magnetic: boolean }> = {
  primary: {
    classes: "bg-primary text-on-primary shadow-sm hover:bg-primary-hi hover:shadow-md",
    magnetic: true,
  },
  ghost: {
    classes: "bg-transparent text-ink border border-line hover:border-primary hover:text-primary",
    magnetic: false,
  },
  "on-dark": {
    classes: "bg-surface text-primary-deep",
    magnetic: true,
  },
  "outline-on-dark": {
    classes: "bg-transparent text-on-primary border border-white/40 hover:border-white",
    magnetic: false,
  },
};

interface ButtonProps {
  href?: string;
  variant?: Variant;
  block?: boolean;
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
  onClick?: () => void;
}

export function Button({
  href,
  variant = "primary",
  block = false,
  children,
  type = "button",
  className = "",
  onClick,
}: ButtonProps) {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { classes: variantClasses, magnetic } = variantConfig[variant];

  function getEl(): HTMLAnchorElement | HTMLButtonElement | null {
    return anchorRef.current ?? buttonRef.current;
  }

  function handleMouseMove(e: MouseEvent) {
    const el = getEl();
    if (!magnetic || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
  }

  function handleMouseLeave() {
    const el = getEl();
    if (el) el.style.transform = "translate(0,0)";
  }

  const classes = [
    "inline-flex items-center justify-center gap-[0.55em] whitespace-nowrap rounded-pill px-[1.6em] py-[0.9em] font-sans text-[0.96rem] font-bold no-underline transition-[transform,box-shadow,background-color,border-color] duration-200 [&_svg]:size-[1.05em] [&_svg]:shrink-0",
    variantClasses,
    block ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link
        ref={anchorRef}
        href={href}
        className={classes}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      className={classes}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
