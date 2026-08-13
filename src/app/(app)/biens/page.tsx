import { biens } from "@/lib/mock-data";
import { BienCard } from "@/components/app/BienCard";

export default function BiensPage() {
  return (
    <div>
      <h1 className="font-display text-ink text-[1.9rem] font-bold">Biens</h1>
      <p className="text-ink-2 mt-2 text-[0.95rem]">
        {biens.length} biens dans votre parc locatif.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {biens.map((bien) => (
          <BienCard key={bien.id} bien={bien} />
        ))}
      </div>
    </div>
  );
}
