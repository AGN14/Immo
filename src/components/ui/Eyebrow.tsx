export function Eyebrow({ children }: { children: string }) {
  return (
    <span className="text-primary-deep inline-flex items-center gap-2 font-mono text-[0.76rem] font-semibold tracking-[0.14em] uppercase">
      <span className="bg-primary-deep inline-block h-[1.5px] w-[1.4em]" />
      {children}
    </span>
  );
}
