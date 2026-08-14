export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <>
      <span
        className={`text-on-primary grid size-8 shrink-0 place-items-center rounded-sm ${
          onDark ? "bg-on-primary/15" : "bg-primary"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9h12v-9" />
          <path d="M10 19v-5h4v5" />
        </svg>
      </span>
      <span
        className={`font-display text-xl font-semibold ${onDark ? "text-on-primary" : "text-ink"}`}
      >
        Immo
      </span>
    </>
  );
}
