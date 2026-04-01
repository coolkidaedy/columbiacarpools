const NYC = "America/New_York";

function parts(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: NYC,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(d);
}

function nycClock(d: Date) {
  const p = parts(d);
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return {
    y: n("year"),
    mo: n("month"),
    day: n("day"),
    h: n("hour"),
    m: n("minute"),
  };
}

/** YYYY-MM-DD for the calendar date of `d` in America/New_York. */
export function nycYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NYC,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * UTC instant where NYC wall clock equals ymd + hour:minute (within 1 minute).
 * Searches a window around a rough estimate (handles DST).
 */
export function utcFromNycWallClock(ymd: string, hour24: number, minute: number): Date {
  const [ys, ms, ds] = ymd.split("-").map(Number);
  const rough = Date.UTC(ys, ms - 1, ds, hour24 + 5, minute, 0);
  const from = rough - 3 * 60 * 60_000;
  const to = rough + 3 * 60 * 60_000;
  for (let t = from; t <= to; t += 60_000) {
    const d = new Date(t);
    const c = nycClock(d);
    const [y, m, day] = ymd.split("-").map(Number);
    if (c.y === y && c.mo === m && c.day === day && c.h === hour24 && c.m === minute) {
      return d;
    }
  }
  return new Date(rough);
}

export function todayYmdNyc(refNow: Date = new Date()): string {
  return nycYmd(refNow);
}

/** Approximate next calendar day in NYC (good enough for ride scheduling). */
export function tomorrowYmdNyc(refNow: Date = new Date()): string {
  return nycYmd(new Date(refNow.getTime() + 24 * 60 * 60_000));
}

/** Latest selectable calendar date (inclusive) for booking ~`daysAhead` days out. */
export function maxBookingYmdNyc(refNow: Date = new Date(), daysAhead: number = 365): string {
  return nycYmd(new Date(refNow.getTime() + daysAhead * 24 * 60 * 60_000));
}

export function formatTime12hNyc(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: NYC,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatTime24hNyc(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: NYC,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

function formatShortMonthDayFromYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(utcNoon);
}

export function rideGroupLabel(ymd: string, today: string, tomorrow: string): string {
  const tail = formatShortMonthDayFromYmd(ymd);
  if (ymd === today) return `Today - ${tail}`;
  if (ymd === tomorrow) return `Tomorrow - ${tail}`;
  return tail;
}

/** Subtitle line like "Leaves in 3h" or "Apr 5 · 2:30 PM". */
export function timeAwayLabel(departure: Date, refNow: Date = new Date()): string {
  const depY = nycYmd(departure);
  const today = nycYmd(refNow);
  const ms = departure.getTime() - refNow.getTime();
  const hours = ms / (60 * 60_000);

  if (depY === today) {
    if (hours < 0) return "Departed";
    if (hours < 1) return "Leaving soon";
    return `Leaves in ${Math.round(hours)}h`;
  }
  return `${formatShortMonthDayFromYmd(depY)} · ${formatTime12hNyc(departure)}`;
}
