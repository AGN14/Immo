"use client";

import { useRef, useState } from "react";

interface ChampPhotoProps {
  /** Nom du champ dans le FormData envoyé à l'action. */
  nom: string;
  label: string;
  /** Format d'image accepté par l'appareil photo du téléphone. */
  accept?: string;
  /** Photo déjà en place (édition) : affichée jusqu'à un nouveau choix. */
  apercuInitial?: string | null;
}

/** Champ d'upload d'image avec aperçu local : la photo n'est envoyée qu'à la
 *  soumission du formulaire (elle voyage dans le FormData de l'action). */
export function ChampPhoto({
  nom,
  label,
  accept = "image/*",
  apercuInitial = null,
}: ChampPhotoProps) {
  const [apercu, setApercu] = useState<string | null>(apercuInitial);
  const [vide, setVide] = useState(!apercuInitial);
  const inputRef = useRef<HTMLInputElement>(null);

  const surSelection = (fichier: File | undefined) => {
    if (!fichier) return;
    setApercu((ancien) => {
      if (ancien && ancien !== apercuInitial) URL.revokeObjectURL(ancien);
      return URL.createObjectURL(fichier);
    });
    setVide(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-ink-2 text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div className="border-line bg-sand grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border">
          {apercu ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={apercu} alt="Aperçu de la photo" className="size-full object-cover" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-ink-3 size-6"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="m5 18 5-5 3 3 2-2 4 4" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          name={nom}
          id={nom}
          accept={accept}
          className="sr-only"
          onChange={(e) => surSelection(e.target.files?.[0])}
        />
        {vide ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="border-line text-ink-2 hover:border-ink-3 hover:text-ink rounded-md border px-3 py-2 text-sm font-medium transition-colors"
          >
            {apercuInitial ? "Changer" : "Ajouter une photo"}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="border-line text-ink-2 hover:border-ink-3 hover:text-ink rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            >
              Changer
            </button>
            {/* La photo initiale (édition) ne se retire pas : sans nouvelle
                photo, l'action conserve l'image déjà en place. */}
            {apercu !== apercuInitial && (
              <button
                type="button"
                onClick={() => {
                  setApercu(null);
                  setVide(true);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-ink-3 hover:text-ink text-sm font-medium transition-colors"
              >
                Retirer
              </button>
            )}
          </div>
        )}
      </div>
      <span className="text-ink-3 text-sm">
        Depuis votre téléphone : photo, pellicule ou appareil. JPG, PNG, WebP ou GIF, 5 Mo max.
      </span>
    </div>
  );
}
