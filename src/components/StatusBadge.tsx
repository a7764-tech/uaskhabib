import { label } from "@/lib/booking";

const colors: Record<string, string> = {
  MENUNGGU_PERSETUJUAN: "bg-amber-100 text-amber-800",
  DISETUJUI: "bg-blue-100 text-blue-800",
  MENUNGGU_VERIFIKASI: "bg-violet-100 text-violet-800",
  TERKONFIRMASI: "bg-emerald-100 text-emerald-800",
  SELESAI: "bg-slate-100 text-slate-700",
  DITOLAK: "bg-red-100 text-red-700",
  DIBATALKAN: "bg-slate-100 text-slate-600",
  MENUNGGU: "bg-violet-100 text-violet-800",
  VALID: "bg-emerald-100 text-emerald-800",
  ORGANISASI: "bg-indigo-100 text-indigo-700",
  AKADEMIK: "bg-sky-100 text-sky-700",
  UMUM: "bg-amber-100 text-amber-800",
  PETUGAS: "bg-violet-100 text-violet-700",
  PENYEWA: "bg-slate-100 text-slate-700",
};
const purposeLabels: Record<string, string> = {
  ORGANISASI: "Organisasi",
  AKADEMIK: "Akademik",
  UMUM: "Pribadi/Umum",
  PETUGAS: "Petugas",
  PENYEWA: "Penyewa",
  MENUNGGU: "Menunggu",
  VALID: "Valid",
  DITOLAK: "Ditolak",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${colors[status] ?? "bg-slate-100 text-slate-700"}`}>{purposeLabels[status] ?? label[status] ?? status}</span>;
}
