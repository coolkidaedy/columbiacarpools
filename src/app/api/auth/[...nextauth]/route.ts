import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "../../../../../generated/prisma/client";

const CLIENT_ID = process.env.CLIENT_ID!
const CLIENT_SECRET = process.env.CLIENT_SECRET!

const prisma = new PrismaClient();

const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    providers: [
        GoogleProvider({
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
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
                    name: user?.name ?? profile?.name ?? undefined,
                },
                create: {
                    email,
                    uni,
                    name: user?.name ?? profile?.name ?? undefined,
                },
            });

            return true;
            }
    }
}
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
