import { NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { developmentSessionCookieName } from "./auth-cookie";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  ...(process.env.NODE_ENV === "development" && {
    cookies: {
      sessionToken: {
        name: developmentSessionCookieName,
        options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
      },
    },
  }),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    async authorize(c) {
      const email = c?.email?.trim().toLowerCase() ?? "";
      const u = await prisma.user.findUnique({ where: { email } });
      if (!u || !u.isActive || !(await bcrypt.compare(c?.password ?? "", u.password))) return null;
      return { id: u.id, name: u.name, email: u.email, role: u.role } as any;
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user) { token.id = (user as any).id; token.role = (user as any).role; } return token; },
    session({ session, token }) { Object.assign(session.user as any, { id: token.id, role: token.role }); return session; },
  },
};
export async function getUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return undefined;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, isActive: true } });
  if (!user?.isActive) return undefined;
  return { id: user.id, name: user.name, role: user.role };
}
