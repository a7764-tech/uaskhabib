"use client";

import { useState } from "react";
import { RoomType } from "@prisma/client";

const defaultImages: Record<RoomType, string> = {
  KELAS: "/rooms/kelas.jpeg",
  LAB: "/rooms/lab.jpeg",
  AULA: "/rooms/aula.jpeg",
  RAPAT: "/rooms/rapat.jpeg",
};

export default function RoomImage({
  type,
  imageUrl,
  name,
  className,
}: {
  type: RoomType;
  imageUrl?: string | null;
  name: string;
  className: string;
}) {
  const fallback = defaultImages[type];
  const [src, setSrc] = useState(imageUrl || fallback);

  return (
    <img
      src={src}
      alt={`Foto ${name}`}
      className={className}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
