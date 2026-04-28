import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDepartureInFuture, maxBookingYmdNyc, todayYmdNyc, utcFromNycWallClock } from "@/lib/nyc-datetime";
import { sendRideDeletedEmail } from "@/lib/email/join-notifications";
import { prisma } from "@/lib/prisma";
import type { Airport, GenderPref } from "@/types/rides";

const AIRPORTS = new Set<Airport>(["JFK", "LGA", "EWR"]);
const GENDER_PREFS = new Set<GenderPref>(["NONE", "WOMEN_ONLY", "MEN_ONLY"]);
const PRISMA_INT_MAX = 2_147_483_647;

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });
}

function validateRideInput(o: Record<string, unknown>) {
  const airport = o.airport;
  const terminal = typeof o.terminal === "string" ? o.terminal : "";
  const departureDate = o.departureDate;
  const time = o.time;
  const totalSpots = o.totalSpots;
  const genderPref = o.genderPref;

  if (typeof airport !== "string" || !AIRPORTS.has(airport as Airport)) return null;
  if (typeof departureDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) return null;

  const [dy, dm, dd] = departureDate.split("-").map(Number);
  if (Number.isNaN(dy) || Number.isNaN(dm) || Number.isNaN(dd)) return null;
  const cal = new Date(Date.UTC(dy, dm - 1, dd));
  if (cal.getUTCFullYear() !== dy || cal.getUTCMonth() !== dm - 1 || cal.getUTCDate() !== dd) return null;

  const today = todayYmdNyc();
  const latest = maxBookingYmdNyc();
  if (departureDate < today || departureDate > latest) return null;

  if (typeof time !== "string" || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const [th, tm] = time.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(th) || Number.isNaN(tm) || th < 0 || th > 23 || tm < 0 || tm > 59) return null;

  if (
    typeof totalSpots !== "number" ||
    !Number.isInteger(totalSpots) ||
    totalSpots < 1 ||
    totalSpots > PRISMA_INT_MAX
  ) {
    return null;
  }
  if (typeof genderPref !== "string" || !GENDER_PREFS.has(genderPref as GenderPref)) return null;

  return {
    airport: airport as Airport,
    terminal: terminal.trim() || null,
    departureTime: utcFromNycWallClock(departureDate, th, tm),
    maxRiders: totalSpots,
    genderPref: genderPref as GenderPref,
  };
}

async function requireOwnedOpenRide(id: string, userId: string) {
  return prisma.ride.findFirst({
    where: { id, posterId: userId, status: "OPEN" },
    select: { id: true },
  });
}

async function requireOwnedRide(id: string, userId: string) {
  return prisma.ride.findFirst({
    where: { id, posterId: userId },
    select: { id: true },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const owned = await requireOwnedOpenRide(id, user.id);
  if (!owned) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = validateRideInput(body as Record<string, unknown>);
  if (!parsed) return NextResponse.json({ error: "Invalid ride payload" }, { status: 400 });
  if (!isDepartureInFuture(parsed.departureTime, new Date())) {
    return NextResponse.json(
      { error: "That departure time has already passed (Eastern Time). Choose a later date or time." },
      { status: 400 }
    );
  }

  await prisma.ride.update({
    where: { id },
    data: {
      airport: parsed.airport,
      terminal: parsed.terminal,
      departureTime: parsed.departureTime,
      flightTime: parsed.departureTime,
      maxRiders: parsed.maxRiders,
      genderPref: parsed.genderPref,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const owned = await prisma.ride.findFirst({
    where: { id, posterId: user.id },
    select: {
      id: true,
      airport: true,
      departureTime: true,
      requests: {
        where: { status: "ACCEPTED" },
        select: {
          requester: { select: { email: true, name: true } },
        },
      },
    },
  });
  if (!owned) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.report.deleteMany({ where: { rideId: id } });
    await tx.joinRequest.deleteMany({ where: { rideId: id } });
    await tx.ride.delete({ where: { id } });
  });

  await Promise.all(
    owned.requests.map(async (request) => {
      await sendRideDeletedEmail({
        riderEmail: request.requester.email,
        riderName: request.requester.name,
        airport: owned.airport,
        departure: owned.departureTime,
      });
    })
  );

  return NextResponse.json({ ok: true });
}
