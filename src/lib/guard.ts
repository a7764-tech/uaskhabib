import { NextResponse } from "next/server";
import { getUser } from "./auth";
export async function admin() { const u = await getUser(); return u?.role === "PETUGAS" ? u : null; }
export const deny = () => NextResponse.json({ error: "Hanya petugas sarana prasarana" }, { status: 403 });
