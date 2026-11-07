"use client";
import { signOut } from "next-auth/react";
export default function SignOut() { return <button className="btn-o" onClick={() => signOut({ callbackUrl: "/login" })}>Keluar</button>; }
