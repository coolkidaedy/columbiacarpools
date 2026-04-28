import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: rideId } = await context.params;
  const ride = await prisma.ride.findFirst({
    where: { id: rideId, posterId: userId, status: "OPEN" },
    select: { id: true },
  });
  if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

  const requests = await prisma.joinRequest.findMany({
    where: { rideId, status: "PENDING", tokenExpiry: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      message: true,
      createdAt: true,
      requester: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      requesterFirstName: (r.requester.name?.trim().split(/\s+/)[0] ?? "Student").trim(),
      requesterEmail: r.requester.email,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
