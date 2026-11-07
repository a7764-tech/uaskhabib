import { prisma } from "./prisma";
export const ACTIVE = ["DISETUJUI","MENUNGGU_VERIFIKASI","TERKONFIRMASI"] as const;
export const at = (date: string, hm: string) => new Date(`${date}T${hm}:00+07:00`);

export const notify = (userId: string, message: string) => prisma.notification.create({ data: { userId, message } });
export const label: Record<string, string> = {
  MENUNGGU_PERSETUJUAN: "Menunggu Persetujuan", DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak", MENUNGGU_VERIFIKASI: "Menunggu Verifikasi Pembayaran", TERKONFIRMASI: "Terkonfirmasi", SELESAI: "Selesai", DIBATALKAN: "Dibatalkan",
};
