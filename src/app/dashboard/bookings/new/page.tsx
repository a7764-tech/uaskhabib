import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import BookingForm from "@/components/BookingForm";

type SearchParams = { room?: string; purposeType?: string };

export const dynamic = "force-dynamic";

export default async function NewBooking({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const user = await getUser();
  if (!user || user.role !== "PENYEWA") redirect("/login");
  const rooms = await prisma.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const purpose = ["ORGANISASI", "AKADEMIK", "UMUM"].includes(query.purposeType ?? "")
    ? query.purposeType as "ORGANISASI" | "AKADEMIK" | "UMUM"
    : undefined;
  return <BookingForm rooms={rooms} roomId={query.room} initialPurpose={purpose} userName={user.name} />;
}
