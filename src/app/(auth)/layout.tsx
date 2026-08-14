import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

/**
 * Composition « guichet » : même mise en page sur téléphone et sur bureau.
 * Le formulaire vit dans une carte, comme tout autre bloc de contenu du site,
 * et le header maintient le lien avec la landing.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper flex min-h-dvh flex-col">
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex h-[68px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-ink-2 hover:text-ink text-sm font-medium no-underline transition-colors"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="border-line border-t py-5">
        <p className="text-ink-2 mx-auto px-5 text-center text-sm sm:px-8">
          L&rsquo;accès locataire est et restera toujours gratuit.
        </p>
      </footer>
    </div>
  );
}
