import type { JoinRequest, Ride } from "@prisma/client";
import {
  formatTime12hNyc,
  formatTime24hNyc,
  nycYmd,
  rideGroupLabel,
  timeAwayLabel,
  todayYmdNyc,
  tomorrowYmdNyc,
} from "@/lib/nyc-datetime";
import type { Airport, DashboardRidesPayload, GenderPref, RideGroup, RideListItem } from "@/types/rides";

export type RideWithRequestStatuses = Ride & {
  requests: Pick<JoinRequest, "status">[];
};

function terminalLabel(raw: string | null | undefined): string {
  const t = raw?.trim();
  if (!t) return "Terminal TBD";
  return t.toLowerCase().startsWith("terminal") ? t : `Terminal ${t}`;
}

export function mapRideToListItem(
  ride: RideWithRequestStatuses,
  currentUserId: string,
  refNow: Date
): RideListItem {
  const departure = new Date(ride.departureTime);
  const accepted = ride.requests.filter((r) => r.status === "ACCEPTED").length;
  const pending = ride.requests.filter((r) => r.status === "PENDING").length;
  const isYours = ride.posterId === currentUserId;

  return {
    id: ride.id,
    airport: ride.airport as Airport,
    terminal: terminalLabel(ride.terminal),
    terminalInput: ride.terminal ?? "",
    departureDate: nycYmd(departure),
    departureTime24: formatTime24hNyc(departure),
    departureTime: formatTime12hNyc(departure),
    totalSpots: ride.maxRiders,
    filledSpots: Math.min(ride.maxRiders, accepted + 1),
    genderPref: ride.genderPref as GenderPref,
    timeAway: timeAwayLabel(departure, refNow),
    isYours,
    pendingRequests: isYours && pending > 0 ? pending : undefined,
  };
}

export function groupRidesForDashboard(
  rides: RideWithRequestStatuses[],
  currentUserId: string,
  refNow: Date = new Date()
): DashboardRidesPayload {
  const sorted = [...rides].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );

  const today = todayYmdNyc(refNow);
  const tomorrow = tomorrowYmdNyc(refNow);
  const order: string[] = [];
  const byYmd = new Map<string, RideListItem[]>();
  const myRides: RideListItem[] = [];

  for (const ride of sorted) {
    const item = mapRideToListItem(ride, currentUserId, refNow);
    if (item.isYours) {
      myRides.push(item);
      continue;
    }
    const ymd = nycYmd(new Date(ride.departureTime));
    if (!byYmd.has(ymd)) {
      order.push(ymd);
      byYmd.set(ymd, []);
    }
    byYmd.get(ymd)!.push(item);
  }

  myRides.sort(
    (a, b) =>
      a.departureDate.localeCompare(b.departureDate) || a.departureTime24.localeCompare(b.departureTime24)
  );

  for (const rides of byYmd.values()) {
    rides.sort((a, b) => a.departureTime24.localeCompare(b.departureTime24));
  }

  const groups: RideGroup[] = order.map((ymd) => ({
    date: rideGroupLabel(ymd, today, tomorrow),
    rides: byYmd.get(ymd)!,
  }));

  return { myRides, groups };
}
