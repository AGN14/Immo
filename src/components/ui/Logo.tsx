import logoImmo from "@/assets/logo_immo.png";

export function Logo({
  onDark = false,
  compact = false,
}: {
  onDark?: boolean;
  /** Variante du rail de la sidebar repliée : la pastille seule, sans texte
   *  ni largeur fixe. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span
        className={`block size-9 shrink-0 rounded-md bg-cover bg-center ${onDark ? "opacity-90" : ""}`}
        style={{ backgroundImage: `url(${logoImmo.src})` }}
        role="img"
        aria-label="Logo Xwégán"
      />
    );
  }
  return (
    <span className="relative -left-6 flex w-[170.442px] cursor-move items-center">
      <span
        className={`block size-25 shrink-0 rounded-md bg-cover bg-center ${onDark ? "opacity-90" : ""}`}
        style={{ backgroundImage: `url(${logoImmo.src})` }}
        role="img"
        aria-label="Logo Xwégán"
      />
      <span
        className={`font-display text-xl font-semibold ${onDark ? "text-on-primary" : "text-ink"}`}
      >
        Xwégán
      </span>
    </span>
  );
}