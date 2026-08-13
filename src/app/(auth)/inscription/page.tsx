import Link from "next/link";

const roles = [
  {
    href: "/inscription/proprietaire",
    title: "Je suis propriétaire",
    body: "Ajoutez vos biens, suivez vos loyers, gérez pannes et litiges.",
    icon: (
      <>
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </>
    ),
  },
  {
    href: "/inscription/locataire",
    title: "Je suis locataire",
    body: "Rejoignez votre bien avec un code, payez votre loyer, signalez vos pannes.",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </>
    ),
  },
];

export default function InscriptionPage() {
  return (
    <div>
      <h1 className="font-display text-ink text-[1.9rem] font-bold">Créer un compte</h1>
      <p className="text-ink-2 mt-2 text-[0.95rem]">
        L&rsquo;accès locataire est et restera toujours gratuit.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {roles.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="border-line bg-surface hover:border-primary flex items-start gap-4 rounded-md border p-5 no-underline transition-colors"
          >
            <span className="bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-[11px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-[22px]"
              >
                {r.icon}
              </svg>
            </span>
            <span>
              <span className="text-ink block text-[1.02rem] font-bold">{r.title}</span>
              <span className="text-ink-2 mt-1 block text-[0.86rem]">{r.body}</span>
            </span>
          </Link>
        ))}
      </div>

      <p className="text-ink-3 mt-6 text-[0.88rem]">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary font-semibold no-underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
