import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { PrismaClient } from "@prisma/client";

function readLocalEnv(): Record<string, string> {
  const filePath = path.join(process.cwd(), ".env");
  if (!existsSync(filePath)) {
    throw new Error("File .env tidak ditemukan. Buat .env dan atur DATABASE_URL serta NEON_DATABASE_URL.");
  }

  const values: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    let value = match[2];
    if (value.startsWith('"') && value.endsWith('"')) {
      try {
        value = JSON.parse(value);
      } catch {
        value = value.slice(1, -1);
      }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function describeConnection(rawUrl: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`${label} bukan URL PostgreSQL yang valid. Periksa nilainya di .env.`);
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error(`${label} harus menggunakan protokol PostgreSQL.`);
  }
  return url;
}

async function askToContinue(): Promise<boolean> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await readline.question('Ketik MIGRATE untuk melanjutkan (jawaban lain membatalkan): ')).trim() === "MIGRATE";
  } finally {
    readline.close();
  }
}

async function main() {
  const localEnv = readLocalEnv();
  const sourceUrl = process.env.DATABASE_URL || localEnv.DATABASE_URL;
  const neonUrl = process.env.NEON_DATABASE_URL || localEnv.NEON_DATABASE_URL;
  if (!sourceUrl) throw new Error("DATABASE_URL lokal tidak ditemukan di .env.");
  if (!neonUrl) throw new Error("Tambahkan NEON_DATABASE_URL dari Neon ke .env. Jangan mengubah DATABASE_URL dahulu.");

  const sourceConnection = describeConnection(sourceUrl, "DATABASE_URL");
  const neonConnection = describeConnection(neonUrl, "NEON_DATABASE_URL");
  if (!neonConnection.hostname.endsWith(".neon.tech") || !neonConnection.searchParams.has("sslmode")) {
    throw new Error("NEON_DATABASE_URL harus memakai host Neon dan connection string SSL dari dashboard Neon.");
  }
  if (sourceUrl === neonUrl || sourceConnection.hostname === neonConnection.hostname) {
    throw new Error("Database sumber dan tujuan tampak sama. Migrasi dibatalkan untuk melindungi data.");
  }

  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  if (!existsSync(prismaCli)) {
    throw new Error("Prisma CLI tidak ditemukan. Jalankan npm install dari folder project terlebih dahulu.");
  }

  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const targetCheck = new PrismaClient({ datasources: { db: { url: neonUrl } } });
  let target: PrismaClient | undefined;

  try {
    const sourceCounts = await Promise.all([
      source.user.count(),
      source.room.count(),
      source.booking.count(),
      source.payment.count(),
      source.notification.count(),
    ]);
    const existingTables = await targetCheck.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    const knownTables = new Set(["users", "rooms", "bookings", "payments", "notifications", "_prisma_migrations"]);
    if (existingTables.some(({ table_name }) => !knownTables.has(table_name))) {
      throw new Error("Database Neon berisi tabel yang bukan milik aplikasi. Migrasi dihentikan tanpa mengubahnya.");
    }

    process.stdout.write("Database sumber lokal berhasil dihubungi.\n");
    process.stdout.write(
      `Data yang akan disalin: ${sourceCounts[0]} pengguna, ${sourceCounts[1]} ruangan, ${sourceCounts[2]} pemesanan, ${sourceCounts[3]} pembayaran, ${sourceCounts[4]} notifikasi.\n`
    );
    process.stdout.write("DATABASE_URL lokal tidak akan diubah oleh skrip ini.\n");
    if (!(await askToContinue())) {
      process.stdout.write("Migrasi dibatalkan. Database tidak diubah.\n");
      return;
    }

    const schemaPush = spawnSync(process.execPath, [prismaCli, "db", "push"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: neonUrl, DIRECT_URL: neonUrl },
      stdio: "inherit",
    });
    if (schemaPush.error) throw schemaPush.error;
    if (schemaPush.status !== 0) throw new Error("Skema database Neon gagal disiapkan. Data lokal tidak diubah.");

    target = new PrismaClient({ datasources: { db: { url: neonUrl } } });
    const targetCounts = await Promise.all([
      target.user.count(),
      target.room.count(),
      target.booking.count(),
      target.payment.count(),
      target.notification.count(),
    ]);
    if (targetCounts.some(count => count !== 0)) {
      throw new Error("Tabel aplikasi pada database Neon tidak kosong. Data tidak disalin untuk mencegah duplikasi atau penimpaan.");
    }

    const [users, rooms, bookings, payments, notifications] = await Promise.all([
      source.user.findMany(),
      source.room.findMany(),
      source.booking.findMany(),
      source.payment.findMany(),
      source.notification.findMany(),
    ]);

    await target.$transaction(async tx => {
      await tx.user.createMany({ data: users });
      await tx.room.createMany({ data: rooms });
      await tx.booking.createMany({ data: bookings });
      await tx.payment.createMany({ data: payments });
      await tx.notification.createMany({ data: notifications });
    }, { maxWait: 15_000, timeout: 120_000 });

    const migratedCounts = await Promise.all([
      target.user.count(),
      target.room.count(),
      target.booking.count(),
      target.payment.count(),
      target.notification.count(),
    ]);
    if (migratedCounts.some((count, index) => count !== sourceCounts[index])) {
      throw new Error("Jumlah data setelah migrasi tidak cocok. Periksa database Neon sebelum mengalihkan aplikasi.");
    }

    process.stdout.write("Migrasi berhasil. Semua baris tabel aplikasi telah disalin dan jumlah data sudah diverifikasi.\n");
    process.stdout.write("Jalankan npm run migrate:uploads setelah mengatur DATABASE_URL ke Neon dan BLOB_READ_WRITE_TOKEN untuk memindahkan berkas lokal.\n");
    process.stdout.write("Setelah memeriksa data Neon, gunakan URL pooled untuk DATABASE_URL dan URL direct untuk DIRECT_URL.\n");
  } finally {
    await target?.$disconnect();
    await targetCheck.$disconnect();
    await source.$disconnect();
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : "Migrasi gagal."}\n`);
  process.exitCode = 1;
});
