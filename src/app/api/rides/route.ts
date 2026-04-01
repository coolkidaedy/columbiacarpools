import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { groupRidesForDashboard, type RideWithRequestStatuses } from "@/lib/rides-mapper";
import { maxBookingYmdNyc, todayYmdNyc, utcFromNycWallClock } from "@/lib/nyc-datetime";
import { prisma } from "@/lib/prisma";
import type { Airport, GenderPref } from "@/types/rides";

const AIRPORTS = new Set<Airport>(["JFK", "LGA", "EWR"]);
const GENDER_PREFS = new Set<GenderPref>(["NONE", "WOMEN_ONLY", "MEN_ONLY"]);

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const yearAhead = new Date(now.getTime() + 365 * 24 * 60 * 60_000);

  const rides = await prisma.ride.findMany({
    where: {
      status: "OPEN",
      departureTime: { gte: now, lte: yearAhead },
    },
    include: {
      requests: { select: { status: true } },
    },
    orderBy: { departureTime: "asc" },
  });

  const groups = groupRidesForDashboard(rides as RideWithRequestStatuses[], user.id, now);
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const airport = o.airport;
  const terminal = typeof o.terminal === "string" ? o.terminal : "";
  const departureDate = o.departureDate;
  const time = o.time;
  const totalSpots = o.totalSpots;
  const genderPref = o.genderPref;

  if (typeof airport !== "string" || !AIRPORTS.has(airport as Airport)) {
    return NextResponse.json({ error: "Invalid airport" }, { status: 400 });
  }
  if (typeof departureDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
    return NextResponse.json({ error: "Invalid departure date" }, { status: 400 });
  }
  const [dy, dm, dd] = departureDate.split("-").map(Number);
  if (Number.isNaN(dy) || Number.isNaN(dm) || Number.isNaN(dd)) {
    return NextResponse.json({ error: "Invalid departure date" }, { status: 400 });
  }
  const cal = new Date(Date.UTC(dy, dm - 1, dd));
  if (
    cal.getUTCFullYear() !== dy ||
    cal.getUTCMonth() !== dm - 1 ||
    cal.getUTCDate() !== dd
  ) {
    return NextResponse.json({ error: "Invalid departure date" }, { status: 400 });
  }
  const today = todayYmdNyc();
  const latest = maxBookingYmdNyc();
  if (departureDate < today || departureDate > latest) {
    return NextResponse.json({ error: "Departure date out of range" }, { status: 400 });
  }
  if (typeof time !== "string" || !/^\d{1,2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }
  const [th, tm] = time.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(th) || Number.isNaN(tm) || th < 0 || th > 23 || tm < 0 || tm > 59) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }
  const PRISMA_INT_MAX = 2_147_483_647;
  if (
    typeof totalSpots !== "number" ||
    !Number.isInteger(totalSpots) ||
    totalSpots < 1 ||
    totalSpots > PRISMA_INT_MAX
  ) {
    return NextResponse.json({ error: "Invalid total spots" }, { status: 400 });
  }
  if (typeof genderPref !== "string" || !GENDER_PREFS.has(genderPref as GenderPref)) {
    return NextResponse.json({ error: "Invalid genderPref" }, { status: 400 });
  }

  const departureTime = utcFromNycWallClock(departureDate, th, tm);
  const term = terminal.trim();

  const ride = await prisma.ride.create({
    data: {
      posterId: user.id,
      airport: airport as Airport,
      terminal: term || null,
      departureTime,
      flightTime: departureTime,
      maxRiders: totalSpots,
      genderPref: genderPref as GenderPref,
    },
    include: {
      requests: { select: { status: true } },
    },
  });

  return NextResponse.json({ id: ride.id }, { status: 201 });
}
