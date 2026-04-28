import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicRequesterLabel, sendPosterPendingRequestEmail } from "@/lib/email/join-notifications";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rideId } = await context.params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let message: string | null = null;
  try {
    const json = await request.json().catch(() => null);
    if (json && typeof json === "object" && typeof (json as { message?: unknown }).message === "string") {
      message = String((json as { message: string }).message).trim() || null;
      if (message && message.length > 500) message = message.slice(0, 500);
    }
  } catch {
    message = null;
  }

  const ride = await prisma.ride.findFirst({
    where: { id: rideId, status: "OPEN" },
    select: {
      id: true,
      posterId: true,
      airport: true,
      departureTime: true,
      maxRiders: true,
    },
  });

  if (!ride) {
    return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  }

  if (ride.posterId === user.id) {
    return NextResponse.json({ error: "Cannot request your own ride" }, { status: 400 });
  }

  if (ride.departureTime <= new Date()) {
    return NextResponse.json({ error: "This ride has already left" }, { status: 400 });
  }

  const passengerSlots = Math.max(0, ride.maxRiders - 1);
  const acceptedCount = await prisma.joinRequest.count({
    where: { rideId, status: "ACCEPTED" },
  });
  if (acceptedCount >= passengerSlots) {
    return NextResponse.json({ error: "This ride is full" }, { status: 400 });
  }

  const poster = await prisma.user.findUnique({
    where: { id: ride.posterId },
    select: { email: true },
  });
  if (!poster?.email) {
    return NextResponse.json({ error: "Could not notify driver" }, { status: 500 });
  }

  const existing = await prisma.joinRequest.findUnique({
    where: { rideId_requesterId: { rideId, requesterId: user.id } },
  });

  let token: string;

  if (existing) {
    if (existing.status === "PENDING" || existing.status === "ACCEPTED") {
      return NextResponse.json({ error: "You already requested this ride" }, { status: 409 });
    }
    if (existing.status === "DECLINED") {
      return NextResponse.json(
        { error: "This driver already declined your request for this ride" },
        { status: 403 }
      );
    }
    const expiry = new Date(Date.now() + 48 * 60 * 60_000);
    token = randomUUID();
    await prisma.joinRequest.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        token,
        tokenExpiry: expiry,
        message,
      },
    });
  } else {
    const created = await prisma.joinRequest.create({
      data: {
        rideId,
        requesterId: user.id,
        tokenExpiry: new Date(Date.now() + 48 * 60 * 60_000),
        message,
      },
      select: { token: true },
    });
    token = created.token;
  }

  const label = publicRequesterLabel(user.name);

  await sendPosterPendingRequestEmail({
    posterEmail: poster.email,
    requesterFirstName: label,
    airport: ride.airport,
    departure: ride.departureTime,
    token,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rideId } = await context.params;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.joinRequest.findUnique({
    where: { rideId_requesterId: { rideId, requesterId: user.id } },
    select: { id: true, status: true },
  });
  if (!existing || (existing.status !== "ACCEPTED" && existing.status !== "PENDING")) {
    return NextResponse.json({ error: "You are not in this ride" }, { status: 404 });
  }

  await prisma.joinRequest.update({
    where: { id: existing.id },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ ok: true });
}
