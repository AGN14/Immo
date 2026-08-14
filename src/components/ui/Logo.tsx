import Image from "next/image";
import logoImmo from "@/assets/logo_immo.jpeg";

export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <>
      <Image
        src={logoImmo}
        alt=""
        aria-hidden="true"
        priority
        className={`h-8 w-auto shrink-0 ${onDark ? "opacity-90" : ""}`}
      />
      <span
        className={`font-display text-xl font-semibold ${onDark ? "text-on-primary" : "text-ink"}`}
      >
        Immo
      </span>
    </>
  );
}
