import Link from "next/link";

const roles = [
  {
    href: "/inscription/proprietaire",
    title: "Je suis propriétaire",
    body: "Ajoutez vos biens, suivez vos loyers, gérez pannes et litiges.",
  },
  {
    href: "/inscription/locataire",
    title: "Je suis locataire",
    body: "Rejoignez votre bien avec un code, payez votre loyer, signalez vos pannes.",
  },
];

export default function InscriptionPage() {
  return (
    <>
      <div className="border-line bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-ink text-2xl font-semibold">Créer un compte</h1>
        <p className="text-ink-2 mt-1 text-sm">Choisissez le profil qui vous correspond.</p>

        <div className="mt-6 flex flex-col gap-3">
          {roles.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="border-line hover:border-primary hover:bg-highlight group flex items-center justify-between gap-4 rounded-md border p-4 no-underline transition-colors"
            >
              <span>
                <span className="text-ink block font-semibold">{r.title}</span>
                <span className="text-ink-2 mt-0.5 block text-sm">{r.body}</span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ink-3 group-hover:text-primary size-4 shrink-0 transition-colors"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-ink-2 mt-5 text-center text-sm">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary font-semibold no-underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
