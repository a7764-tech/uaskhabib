import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const contentTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

function blobUrl(pathname: string) {
  return `/api/upload?pathname=${encodeURIComponent(pathname)}`;
}

async function main() {
  const [rooms, bookings, payments] = await Promise.all([
    prisma.room.findMany({ where: { imageUrl: { startsWith: "/uploads/" } }, select: { imageUrl: true } }),
    prisma.booking.findMany({ where: { documentUrl: { startsWith: "/uploads/" } }, select: { documentUrl: true } }),
    prisma.payment.findMany({ where: { proofUrl: { startsWith: "/uploads/" } }, select: { proofUrl: true } }),
  ]);
  const oldUrls = [...new Set([
    ...rooms.map(room => room.imageUrl),
    ...bookings.map(booking => booking.documentUrl),
    ...payments.map(payment => payment.proofUrl),
  ].filter((url): url is string => Boolean(url)))];

  if (!oldUrls.length) {
    process.stdout.write("Tidak ada unggahan lokal yang perlu dipindahkan.\n");
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Atur BLOB_READ_WRITE_TOKEN dari private Blob store sebelum memindahkan unggahan.");
  }

  const files = await Promise.all(oldUrls.map(async url => {
    const match = url.match(/^\/uploads\/([a-zA-Z0-9_-]+\.(?:pdf|jpe?g|png))$/i);
    if (!match) throw new Error(`URL unggahan lokal tidak didukung: ${url}`);

    const extension = path.extname(match[1]).toLowerCase();
    const contentType = contentTypes[extension];
    const sourcePath = path.join(process.cwd(), "public", "uploads", match[1]);
    let body: Buffer;
    try {
      body = await readFile(sourcePath);
    } catch {
      throw new Error(`File unggahan tidak ditemukan: ${sourcePath}`);
    }

    return { oldUrl: url, body, contentType };
  }));

  const migrated = await Promise.all(files.map(async file => {
    const pathname = `uploads/${randomUUID()}${path.extname(file.oldUrl).toLowerCase()}`;
    await put(pathname, new Blob([new Uint8Array(file.body)], { type: file.contentType }), {
      access: "private",
      addRandomSuffix: false,
      contentType: file.contentType,
    });
    return { oldUrl: file.oldUrl, newUrl: blobUrl(pathname) };
  }));

  await prisma.$transaction(async tx => {
    for (const { oldUrl, newUrl } of migrated) {
      await tx.room.updateMany({ where: { imageUrl: oldUrl }, data: { imageUrl: newUrl } });
      await tx.booking.updateMany({ where: { documentUrl: oldUrl }, data: { documentUrl: newUrl } });
      await tx.payment.updateMany({ where: { proofUrl: oldUrl }, data: { proofUrl: newUrl } });
    }
  });

  process.stdout.write(`${migrated.length} file unggahan berhasil dipindahkan ke private Blob.\n`);
}

main()
  .catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : "Pemindahan unggahan gagal."}\n`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
