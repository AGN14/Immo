"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type ChampFormulaire = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Les champs d'une étape donnée du formulaire. */
export function champsDe(form: HTMLFormElement, n: number): ChampFormulaire[] {
  const conteneur = form.querySelector<HTMLElement>(`[data-etape="${n}"]`);
  if (!conteneur) return [];
  return Array.from(
    conteneur.querySelectorAll<ChampFormulaire>("input, select, textarea"),
  );
}

/** Une étape est valide si tous ses champs passent la validation HTML. */
export function etapeValide(form: HTMLFormElement, n: number): boolean {
  return champsDe(form, n).every((c) => c.checkValidity());
}

/** Focus le premier champ invalide d'une étape, comme le ferait le navigateur. */
export function reporterPremierInvalide(form: HTMLFormElement, n: number) {
  const invalide = champsDe(form, n).find((c) => !c.checkValidity());
  invalide?.reportValidity();
}

/**
 * Navigation d'un formulaire à étapes qui ne valide **que l'étape visible** :
 * le navigateur refuse de focuser un champ masqué (« not focusable »), il
 * faut donc lui épargner les étapes cachées — et le formulaire porte
 * `noValidate` pour que le submit ne les valide pas non plus. La soumission
 * finale passe toutes les étapes en revue et ramène sur la première invalide.
 */
export function useWizardEtapes(nbEtapes: number) {
  const [etape, setEtape] = useState(1);
  const [aReporter, setAReporter] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  // La remontée d'erreur n'a lieu qu'une fois l'étape visible au rendu :
  // un setState est asynchrone, focuser trop tôt retomberait sur un champ caché.
  useEffect(() => {
    if (aReporter && formRef.current) {
      reporterPremierInvalide(formRef.current, etape);
      setAReporter(false);
    }
  }, [etape, aReporter]);

  const aller = (cible: number) => {
    const form = formRef.current;
    if (!form) {
      setEtape(cible);
      return;
    }
    // Avancer ne valide que l'étape en cours, seule visible.
    if (cible > etape && !etapeValide(form, etape)) {
      reporterPremierInvalide(form, etape);
      return;
    }
    setEtape(cible);
  };

  /** À brancher sur onSubmit : le formulaire est noValidate, cette fonction
   *  reprend la validation à la main, toutes étapes confondues. */
  const soumettre = (e: FormEvent<HTMLFormElement>) => {
    for (let n = 1; n <= nbEtapes; n++) {
      if (!etapeValide(e.currentTarget, n)) {
        e.preventDefault();
        setEtape(n);
        setAReporter(true);
        return;
      }
    }
  };

  return { etape, aller, soumettre, formRef };
}
