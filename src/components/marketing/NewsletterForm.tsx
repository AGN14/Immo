"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (done) return;
    setDone(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-1 flex flex-col gap-[0.6rem] sm:flex-row sm:gap-[0.6rem] ${done ? "opacity-60" : ""}`}
    >
      <input
        type="email"
        placeholder="vous@exemple.com"
        aria-label="Adresse e-mail"
        required
        disabled={done}
        className="rounded-pill border-line bg-surface text-ink focus-visible:outline-primary min-w-0 flex-1 border px-[1.1em] py-[0.75em] font-sans text-[0.9rem] focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <button
        type="submit"
        disabled={done}
        className="rounded-pill bg-primary text-on-primary hover:bg-primary-hi w-full px-[1.6em] py-[0.9em] font-sans text-[0.96rem] font-bold shadow-sm transition-colors sm:w-auto"
      >
        {done ? "Merci !" : "S'abonner"}
      </button>
    </form>
  );
}
