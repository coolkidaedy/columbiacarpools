import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { dashboardRideListUntilUtc } from "@/lib/nyc-datetime";
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
  const listUntil = dashboardRideListUntilUtc(now);
  const openRideCount = await prisma.ride.count({
    where: {
      status: "OPEN",
      departureTime: { gte: now, lte: listUntil },
    },
  });

  return (
    <LoginPageClient
      csrfToken={csrfToken}
      openRideCount={openRideCount}
    />
  );
}
