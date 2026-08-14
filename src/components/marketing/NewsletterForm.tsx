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
    <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        placeholder="vous@exemple.com"
        aria-label="Adresse e-mail"
        required
        disabled={done}
        className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary min-w-0 flex-1 rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={done}
        className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {done ? "Merci !" : "S'abonner"}
      </button>
    </form>
  );
}
