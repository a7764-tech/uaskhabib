import "./globals.css";
import Navbar from "@/components/Navbar";
export const metadata = {
  title: "RuangKampus — Sewa Ruang Kampus",
  description: "Cari, ajukan, dan pantau penyewaan ruang kampus dalam satu tempat.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body><Navbar /><main className="mx-auto max-w-6xl px-4 py-6">{children}</main></body></html>;
}
