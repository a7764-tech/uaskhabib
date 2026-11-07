export default function BrandLogo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 via-teal-500 to-emerald-700 shadow-lg shadow-teal-950/25 ring-1 ring-white/30">
        <svg viewBox="0 0 40 40" aria-hidden="true" className="h-7 w-7">
          <path d="M8 17.5 20 8l12 9.5v13a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-13Z" fill="white" />
          <path d="M16 32V21h8v11" fill="#0f766e" />
          <path d="M12.5 20h3v3h-3zm12 0h3v3h-3z" fill="#2dd4bf" />
          <path d="m27 11 2.5-2" stroke="white" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </span>
      <span className="whitespace-nowrap text-[17px] font-extrabold tracking-tight">
        <span className={variant === "light" ? "text-white" : "text-[#12263f]"}>Ruang</span>
        <span className="text-teal-500">Kampus</span>
      </span>
    </span>
  );
}
