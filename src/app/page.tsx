import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groupRidesForDashboard, type RideWithRequestStatuses } from "@/lib/rides-mapper";
import RidesDashboard from "@/components/RidesDashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      id: true,
      name: true,
      school: true,
      year: true,
      preferredCommunication: true,
    },
  });

  if (!user?.school || !user?.year || !user?.preferredCommunication) {
    redirect("/complete-profile");
  }

  const now = new Date();
  const yearAhead = new Date(now.getTime() + 365 * 24 * 60 * 60_000);
  const dbRides = await prisma.ride.findMany({
    where: {
      status: "OPEN",
      departureTime: { gte: now, lte: yearAhead },
    },
    include: {
      requests: { select: { status: true } },
    },
    orderBy: { departureTime: "asc" },
  });

  const initialRideGroups = groupRidesForDashboard(
    dbRides as RideWithRequestStatuses[],
    user.id,
    now
  );

  return (
    <RidesDashboard
      userName={user.name ?? session.user.email}
      initialRideGroups={initialRideGroups}
    />
  );
}
