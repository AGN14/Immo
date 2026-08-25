import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";

type SectionLegale = {
  titre: string;
  corps: ReactNode;
};

export function DocumentLegale({
  type,
  titre,
  introduction,
  miseAJour,
  sections,
}: {
  type: string;
  titre: string;
  introduction: string;
  miseAJour: string;
  sections: SectionLegale[];
}) {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto px-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>{type}</Eyebrow>
          <h1 className="font-display text-ink text-4xl font-semibold text-balance md:text-5xl">
            {titre}
          </h1>
          <p className="text-ink-2 text-lg">{introduction}</p>
          <p className="text-ink-3 text-sm">Dernière mise à jour : {miseAJour}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-[42em] gap-8">
          {sections.map((s) => (
            <section key={s.titre} className="border-line border-t pt-5">
              <h2 className="font-display text-ink text-2xl font-semibold">{s.titre}</h2>
              <div className="text-ink-2 mt-2 space-y-3 text-sm">{s.corps}</div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}