export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <>
      <span
        className={`grid size-[34px] shrink-0 place-items-center rounded-[10px] ${
          onDark ? "bg-white/15" : "bg-primary"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[18px]"
        >
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9h12v-9" />
          <path d="M10 19v-5h4v5" />
        </svg>
      </span>
      <span
        className={`font-display text-[1.28rem] font-bold ${onDark ? "text-white" : "text-ink"}`}
      >
        Immo
      </span>
    </>
  );
}
