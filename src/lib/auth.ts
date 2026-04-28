import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!clientId || !clientSecret || !nextAuthSecret) {
  throw new Error("Missing auth environment variables.");
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId,
      clientSecret,
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (!user?.email) return false;

      const email = user.email.toLowerCase();
      const uni = email.split("@")[0];

      await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name ?? profile?.name ?? undefined,
        },
        create: {
          email,
          uni,
          name: user.name ?? profile?.name ?? undefined,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      // Persist fields on the JWT so API routes always see email (see requireUser in /api/rides).
      if (user) {
        if (user.id) token.id = user.id as string;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if (token.id) session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
