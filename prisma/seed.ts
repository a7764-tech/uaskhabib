import { PrismaClient, BookingPurpose, BookingStatus, RoomType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const password = bcrypt.hashSync("password123", 10);

async function main() {
  const renter = await db.user.upsert({
    where: { email: "rina.putri@mhs.unugiri.ac.id" },
    update: { role: "PENYEWA", isActive: true },
    create: { name: "Rina Putri", email: "rina.putri@mhs.unugiri.ac.id", password, phone: "0812-3456-7890", role: "PENYEWA" },
  });
  await db.user.upsert({
    where: { email: "budi.santoso@unugiri.ac.id" },
    update: { role: "PETUGAS", isActive: true },
    create: { name: "Budi Santoso", email: "budi.santoso@unugiri.ac.id", password, phone: "0813-1111-2222", role: "PETUGAS" },
  });

  const rooms: { name: string; type: RoomType; capacity: number; building: string; floor: number; facilities: string; pricePerHour: number }[] = [
    { name: "Aula Utama", type: "AULA", capacity: 300, building: "Gedung A", floor: 1, facilities: "Proyektor, AC, Sound system, Wi-Fi", pricePerHour: 500000 },
    { name: "Ruang Seminar B", type: "AULA", capacity: 80, building: "Gedung B", floor: 2, facilities: "Proyektor, AC, Sound system, Wi-Fi, Papan tulis", pricePerHour: 150000 },
    { name: "Lab Komputer 1", type: "LAB", capacity: 40, building: "Gedung C", floor: 2, facilities: "Proyektor, AC, Wi-Fi", pricePerHour: 200000 },
    { name: "Lab Multimedia", type: "LAB", capacity: 30, building: "Gedung C", floor: 3, facilities: "AC, Wi-Fi, Komputer", pricePerHour: 175000 },
    { name: "Ruang Rapat A", type: "RAPAT", capacity: 20, building: "Gedung A", floor: 3, facilities: "Proyektor, AC, Wi-Fi", pricePerHour: 100000 },
    { name: "Ruang Kelas 3.2", type: "KELAS", capacity: 40, building: "Gedung B", floor: 3, facilities: "Proyektor, AC, Papan tulis", pricePerHour: 50000 },
  ];

  const roomRecords = await Promise.all(rooms.map(room => db.room.upsert({
    where: { name: room.name },
    update: room,
    create: room,
  })));
  const seminarRoom = roomRecords.find(room => room.name === "Ruang Seminar B")!;
  await db.booking.upsert({
    where: { code: "RK-DEMO-001" },
    update: {},
    create: {
      code: "RK-DEMO-001",
      userId: renter.id,
      roomId: seminarRoom.id,
      date: new Date("2026-11-11T00:00:00.000Z"),
      startTime: new Date("2026-11-11T10:00:00+07:00"),
      endTime: new Date("2026-11-11T13:00:00+07:00"),
      purpose: "Pembahasan program kerja semester ganjil.",
      purposeType: BookingPurpose.ORGANISASI,
      eventName: "Rapat Pengurus Harian HMIF",
      organizationName: "Himpunan Mahasiswa Informatika",
      participants: 40,
      totalPrice: 450000,
      status: BookingStatus.MENUNGGU_PERSETUJUAN,
    },
  });
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
