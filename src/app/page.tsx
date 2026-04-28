import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardRideListUntilUtc } from "@/lib/nyc-datetime";
import { groupRidesForDashboard, type RideWithRequestStatuses } from "@/lib/rides-mapper";
import RidesDashboard from "@/components/RidesDashboard";

/** Always read fresh listings after mutations (`router.refresh`) and for each visit */
export const dynamic = "force-dynamic";

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

  const requestedRows = await prisma.joinRequest.findMany({
    where: {
      requesterId: user.id,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
    select: { rideId: true, status: true },
  });
  const initialJoinRequests = requestedRows.map((r) => ({
    rideId: r.rideId,
    status: r.status as "PENDING" | "ACCEPTED",
  }));

  const now = new Date();
  const listUntil = dashboardRideListUntilUtc(now);
  const dbRides = await prisma.ride.findMany({
    where: {
      status: "OPEN",
      departureTime: { gte: now, lte: listUntil },
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
      initialJoinRequests={initialJoinRequests}
    />
  );
}
