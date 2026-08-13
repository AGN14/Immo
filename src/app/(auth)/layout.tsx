import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-[1fr_1.1fr]">
      <div className="bg-primary-deep relative hidden flex-col justify-between overflow-hidden p-10 text-white md:flex">
        <Link href="/" className="relative z-10 flex items-center gap-[0.65rem] no-underline">
          <Logo onDark />
        </Link>
        <div className="relative z-10 flex flex-col gap-4">
          <p className="font-display max-w-[20em] text-[1.7rem] leading-[1.2] font-bold text-balance">
            Le loyer, les pannes et les litiges — enfin sous contrôle.
          </p>
          <p className="max-w-[24em] text-[0.95rem] text-[#A9C9BE]">
            Immo réunit propriétaires et locataires sur une seule plateforme. L&rsquo;accès
            locataire est et restera toujours gratuit.
          </p>
        </div>
        <div
          className="pointer-events-none absolute -right-24 -bottom-24 size-[380px] rounded-full bg-white/5"
          aria-hidden="true"
        />
      </div>

      <div className="bg-paper flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <Link href="/" className="mb-8 flex items-center gap-[0.65rem] no-underline md:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
