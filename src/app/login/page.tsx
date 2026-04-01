import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginPageClient from "./LoginPageClient";

async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/csrf`,
    { headers: { cookie: cookieStore.toString() } }
  );
  const data = await res.json();
  return data.csrfToken as string;
}

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    redirect("/");
  }

  const csrfToken = await getCsrfToken();

  const now = new Date();
  const yearAhead = new Date(now.getTime() + 365 * 24 * 60 * 60_000);
  const openRideCount = await prisma.ride.count({
    where: {
      status: "OPEN",
      departureTime: { gte: now, lte: yearAhead },
    },
  });

  return <LoginPageClient csrfToken={csrfToken} openRideCount={openRideCount} />;
}
