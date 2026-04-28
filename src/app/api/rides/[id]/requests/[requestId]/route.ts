import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMatchContactEmails, sendRequesterDeclinedEmail } from "@/lib/email/join-notifications";

const userSelect = {
  email: true,
  name: true,
  phoneNumber: true,
  preferredCommunication: true,
} as const;

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; requestId: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: rideId, requestId } = await context.params;
  const body = (await request.json().catch(() => null)) as { action?: unknown } | null;
  const action = body?.action;
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const jr = await prisma.joinRequest.findFirst({
    where: {
      id: requestId,
      rideId,
      status: "PENDING",
      tokenExpiry: { gt: new Date() },
      ride: { posterId: userId, status: "OPEN" },
    },
    include: {
      ride: {
        select: {
          id: true,
          airport: true,
          departureTime: true,
          maxRiders: true,
          poster: { select: userSelect },
        },
      },
      requester: { select: userSelect },
    },
  });

  if (!jr) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (action === "decline") {
    await prisma.joinRequest.update({
      where: { id: jr.id },
      data: { status: "DECLINED" },
    });
    await sendRequesterDeclinedEmail({
      requesterEmail: jr.requester.email,
      airport: jr.ride.airport,
      departure: jr.ride.departureTime,
    });
    return NextResponse.json({ ok: true, outcome: "declined" });
  }

  const passengerSlots = Math.max(0, jr.ride.maxRiders - 1);
  const outcome = await prisma.$transaction(async (tx) => {
    const current = await tx.joinRequest.findUnique({ where: { id: jr.id } });
    if (!current || current.status !== "PENDING") return "stale" as const;

    const acceptedCount = await tx.joinRequest.count({
      where: { rideId: jr.rideId, status: "ACCEPTED" },
    });
    if (acceptedCount >= passengerSlots) return "full" as const;

    await tx.joinRequest.update({
      where: { id: jr.id },
      data: { status: "ACCEPTED" },
    });
    return "ok" as const;
  });

  if (outcome === "full") return NextResponse.json({ error: "This ride is full" }, { status: 409 });
  if (outcome === "stale") return NextResponse.json({ error: "Request is no longer pending" }, { status: 409 });

  await sendMatchContactEmails({
    poster: jr.ride.poster,
    requester: jr.requester,
    airport: jr.ride.airport,
    departure: jr.ride.departureTime,
  });

  return NextResponse.json({ ok: true, outcome: "accepted" });
}
