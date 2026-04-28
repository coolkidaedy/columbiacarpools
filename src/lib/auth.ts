import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!clientId || !clientSecret || !nextAuthSecret) {
  throw new Error("Missing auth environment variables.");
}

/**
 * Optional dev bypass: sign in with this exact email only (no password).
 * Insecure if exposed—use only locally or behind strict network controls.
 */
const devSigninEmail = process.env.DEV_SIGNIN_EMAIL?.toLowerCase().trim();

const providers: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId,
    clientSecret,
  }),
];

if (devSigninEmail) {
  providers.push(
    CredentialsProvider({
      id: "dev-email-signin",
      name: "Dev email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email?.toLowerCase().trim();
        if (!rawEmail || rawEmail !== devSigninEmail) return null;

        const displayName = process.env.DEV_SIGNIN_DISPLAY_NAME?.trim() || "Dev user";
        const uni = `dev${randomBytes(5).toString("hex")}`;

        let user;
        try {
          user = await prisma.user.upsert({
            where: { email: rawEmail },
            update: { name: displayName },
            create: {
              email: rawEmail,
              uni,
              name: displayName,
              school: "Other",
              schoolCustom: "Dev",
              year: "Graduate",
              preferredCommunication: "EMAIL",
            },
          });
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.error("[auth] DEV_SIGNIN_EMAIL prisma.user.upsert failed:", e);
          }
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? displayName,
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async signIn({ user, profile, account }) {
      const devCred =
        account?.provider === "dev-email-signin" ||
        (account?.type === "credentials" && user?.email?.toLowerCase() === devSigninEmail);
      if (devCred) {
        return true;
      }

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
      // Credentials + OAuth: persist fields on the JWT so API routes always see email (see requireUser in /api/rides).
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

export function isDevEmailSigninConfigured(): boolean {
  return Boolean(devSigninEmail);
}
