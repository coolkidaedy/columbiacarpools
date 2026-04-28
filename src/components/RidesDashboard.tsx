"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { defaultDepartureSlotNyc, maxBookingYmdNyc, todayYmdNyc } from "@/lib/nyc-datetime";
import type { Airport, GenderPref, RideGroup, RideListItem } from "@/types/rides";

const SPOT_DOT_CAP = 36;
const AUTO_REFRESH_MS = 20_000;

const AIRPORT_STYLES: Record<Airport, string> = {
  JFK: "bg-[#1a1a1a] text-[#F7F4EF]",
  LGA: "bg-[#2C5F8A] text-[#F7F4EF]",
  EWR: "bg-[#3D6B45] text-[#F7F4EF]",
};

const GENDER_LABEL: Record<GenderPref, string | null> = {
  NONE: null,
  WOMEN_ONLY: "Women only",
  MEN_ONLY: "Men only",
};

type FilterOption = "All airports" | Airport;

function SpotDots({ total, filled }: { total: number; filled: number }) {
  const spotsLeft = total - filled;
  if (total > SPOT_DOT_CAP) {
    const pct = total > 0 ? Math.min(100, (filled / total) * 100) : 0;
    return (
      <div className="flex flex-col gap-1">
        <div className="h-[7px] w-full max-w-full rounded-full bg-[#4A7FD4]/15 sm:max-w-[220px]">
          <div className="h-full rounded-full bg-[#4A7FD4] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-[#aaa]">
          {filled} of {total} filled · {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={`${i}-${filled}`}
          className={`h-[7px] w-[7px] rounded-full transition-opacity ${
            i < filled ? "bg-[#4A7FD4] opacity-100" : "bg-[#4A7FD4] opacity-15"
          }`}
        />
      ))}
      <span className="ml-0.5 text-[11px] text-[#aaa]">
        {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
      </span>
    </div>
  );
}

function RideCard({
  ride,
  joinBusy,
  leaveBusy,
  joinStatus,
  onRequest,
  onLeave,
  onEdit,
  onDelete,
  onManageRequests,
  showManageRequests,
  showJoinActions,
}: {
  ride: RideListItem;
  joinBusy?: boolean;
  leaveBusy?: boolean;
  /** Your request for this ride, if any */
  joinStatus?: "PENDING" | "ACCEPTED";
  onRequest?: (id: string) => void | Promise<void>;
  onLeave?: (id: string) => void | Promise<void>;
  onEdit?: (ride: RideListItem) => void;
  onDelete?: (ride: RideListItem) => void;
  onManageRequests?: (ride: RideListItem) => void;
  showManageRequests?: boolean;
  showJoinActions?: boolean;
}) {
  const genderLabel = GENDER_LABEL[ride.genderPref];

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border px-4 py-4 shadow-[0_1px_6px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_3px_14px_rgba(0,0,0,0.07)] sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:px-6 sm:py-5 sm:hover:-translate-y-px sm:hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] ${
        ride.isYours
          ? "border-[rgba(74,127,212,0.25)] bg-[#FAFCFF]"
          : "border-[rgba(26,26,26,0.08)] bg-white"
      }`}
    >
      <div className="min-w-0 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`rounded-lg px-2.5 py-0.5 text-[13px] font-medium tracking-[0.04em] ${AIRPORT_STYLES[ride.airport]}`}
          >
            {ride.airport}
          </span>
          <span className="rounded-md bg-[#f5f3ef] px-2.5 py-0.5 text-[12px] text-[#888]">
            {ride.terminal}
          </span>
          {genderLabel && (
            <span className="rounded-md border border-[#F5D5B8] bg-[#FDF3EC] px-2.5 py-0.5 text-[11px] text-[#A0522D]">
              {genderLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#aaa]">
              Leaving campus
            </span>
            <span className="text-[13px] text-[#1a1a1a]">{ride.departureTime}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#aaa]">
              Spots
            </span>
            <span className="text-[13px] text-[#1a1a1a]">
              {ride.filledSpots} of {ride.totalSpots}
            </span>
          </div>
        </div>

        <SpotDots total={ride.totalSpots} filled={ride.filledSpots} />
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end sm:text-right">
        {ride.isYours ? (
          <>
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <span className="cursor-default rounded-full border-[1.5px] border-[rgba(26,26,26,0.2)] px-5 py-2.5 text-center text-[13px] font-medium text-[#aaa] sm:inline-block sm:py-2">
                Your ride
              </span>
              <div className="flex gap-2">
                {showManageRequests ? (
                  <button
                    type="button"
                    onClick={() => onManageRequests?.(ride)}
                    className="w-full rounded-full border border-[#4A7FD4]/30 bg-[#EEF4FF] px-4 py-2 text-[12px] font-medium text-[#2f5ea6] sm:w-auto"
                  >
                    Manage requests
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onEdit?.(ride)}
                  className="w-full rounded-full border border-black/20 bg-white px-4 py-2 text-[12px] font-medium text-[#444] sm:w-auto"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(ride)}
                  className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700 sm:w-auto"
                >
                  Delete
                </button>
              </div>
            </div>
            {ride.pendingRequests ? (
              <span className="text-center text-[11px] text-[#4A7FD4] sm:text-right">
                {ride.pendingRequests} pending requests
              </span>
            ) : null}
          </>
        ) : (
          <>
            {!showJoinActions ? (
              <button
                type="button"
                disabled
                className="w-full cursor-default rounded-full border-[1.5px] border-black/10 bg-zinc-100 px-5 py-2.5 text-[13px] font-medium text-[#888] sm:w-auto sm:py-2"
              >
                Loading...
              </button>
            ) : joinStatus === "ACCEPTED" ? (
              <div className="flex w-full gap-2 sm:w-auto">
                <span className="w-full cursor-default rounded-full border-[1.5px] border-black/10 bg-zinc-100 px-5 py-2.5 text-center text-[13px] font-medium text-[#888] sm:w-auto sm:py-2">
                  You're in
                </span>
                <button
                  type="button"
                  disabled={leaveBusy}
                  onClick={() => void onLeave?.(ride.id)}
                  className="w-full rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700 disabled:opacity-60 sm:w-auto"
                >
                  {leaveBusy ? "Leaving..." : "Leave ride"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={Boolean(joinStatus) || joinBusy}
                onClick={() => void onRequest?.(ride.id)}
                className={`w-full rounded-full border-[1.5px] px-5 py-2.5 text-[13px] font-medium transition-all duration-150 sm:w-auto sm:py-2 ${
                  joinStatus || joinBusy
                    ? "cursor-default border-black/10 bg-zinc-100 text-[#888]"
                    : "border-[#1a1a1a] bg-transparent text-[#1a1a1a] active:bg-[#1a1a1a] active:text-[#F7F4EF] sm:hover:bg-[#1a1a1a] sm:hover:text-[#F7F4EF]"
                }`}
              >
                {joinBusy ? "Sending…" : joinStatus === "PENDING" ? "Requested" : "Request to join"}
              </button>
            )}
            <span className="text-center text-[11px] text-[#aaa] sm:text-right">{ride.timeAway}</span>
          </>
        )}
      </div>
    </div>
  );
}

type PostRideFormState = {
  airport: Airport;
  terminal: string;
  departureDate: string;
  time: string;
  totalSpots: number;
  genderPref: GenderPref;
};

type PendingRideRequest = {
  id: string;
  requesterFirstName: string;
  requesterEmail: string;
  message: string | null;
  createdAt: string;
};

export type PostRidePayload = Pick<
  PostRideFormState,
  "airport" | "terminal" | "departureDate" | "time" | "totalSpots" | "genderPref"
>;

function PostRideModal({
  open,
  onClose,
  onSubmit,
  error,
  initialValue,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PostRidePayload) => Promise<boolean>;
  error: string | null;
  initialValue?: Partial<PostRideFormState>;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<PostRideFormState>(() => {
    const slot = defaultDepartureSlotNyc();
    return {
      airport: "JFK",
      terminal: "",
      departureDate: slot.ymd,
      time: slot.time,
      totalSpots: 3,
      genderPref: "NONE",
      ...initialValue,
    };
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.departureDate || form.totalSpots < 1) return;
    const t = form.time.split(":");
    const h = parseInt(t[0] ?? "14", 10);
    const m = parseInt(t[1] ?? "0", 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    setSubmitting(true);
    try {
      const ok = await onSubmit({
        airport: form.airport,
        terminal: form.terminal.trim(),
        departureDate: form.departureDate,
        time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
        totalSpots: form.totalSpots,
        genderPref: form.genderPref,
      });
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-ride-title"
        className="relative z-10 max-h-[min(92dvh,calc(100vh-env(safe-area-inset-bottom,0px)-1rem))] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl border border-black/10 border-b-0 bg-[#F7F4EF] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:rounded-2xl sm:border-b sm:p-6 sm:pb-6"
      >
        <h2 id="post-ride-title" className="font-serif text-xl font-semibold text-[#1a1a1a]">
          {submitLabel === "Save changes" ? "Edit ride" : "Post a ride"}
        </h2>
        <p className="mt-1 text-[13px] text-[#888]">Share your airport trip with other students. When others request to join, you will be notified via email</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <div>
            <label htmlFor="airport" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#888]">
              Airport
            </label>
            <select
              id="airport"
              value={form.airport}
              onChange={(e) => setForm((f) => ({ ...f, airport: e.target.value as Airport }))}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#4A7FD4]/40"
            >
              <option value="JFK">JFK</option>
              <option value="LGA">LGA</option>
              <option value="EWR">EWR</option>
            </select>
          </div>

          <div>
            <label htmlFor="terminal" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#888]">
              Terminal <span className="font-normal normal-case tracking-normal text-[#bbb]">(optional)</span>
            </label>
            <input
              id="terminal"
              type="text"
              placeholder="e.g. 4 or Terminal B"
              value={form.terminal}
              onChange={(e) => setForm((f) => ({ ...f, terminal: e.target.value }))}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#4A7FD4]/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="departureDate" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#888]">
                Date
              </label>
              <input
                id="departureDate"
                type="date"
                required
                min={todayYmdNyc()}
                max={maxBookingYmdNyc()}
                value={form.departureDate}
                onChange={(e) => setForm((f) => ({ ...f, departureDate: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#4A7FD4]/40"
              />
            </div>
            <div>
              <label htmlFor="time" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#888]">
                Leaving campus
              </label>
              <input
                id="time"
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#4A7FD4]/40"
              />
            </div>
          </div>

          <div>
            <label htmlFor="spots" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#888]">
              Total spots (including you)
            </label>
            <input
              id="spots"
              type="number"
              min={1}
              step={1}
              required
              value={form.totalSpots}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setForm((f) => ({
                  ...f,
                  totalSpots: Number.isNaN(n) ? f.totalSpots : Math.max(1, n),
                }));
              }}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#4A7FD4]/40"
            />
          </div>

          <div>
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#888]">
              Passenger preference
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { v: "NONE" as const, label: "No preference" },
                  { v: "WOMEN_ONLY" as const, label: "Women only" },
                  { v: "MEN_ONLY" as const, label: "Men only" },
                ] as const
              ).map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, genderPref: v }))}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    form.genderPref === v
                      ? "border-[#1a1a1a] bg-[#1a1a1a] text-[#F7F4EF]"
                      : "border-black/10 bg-white text-[#555] hover:border-[#4A7FD4]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-[13px] font-medium text-[#555] hover:bg-zinc-50 sm:min-w-[5.5rem]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-medium text-[#F7F4EF] shadow-[0_2px_10px_rgba(26,26,26,0.15)] hover:bg-[#2d2d2d] disabled:opacity-50 sm:min-w-[7rem]"
            >
              {submitting ? "Saving…" : (submitLabel ?? "Post ride")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageRequestsModal({
  ride,
  open,
  requests,
  busyRequestId,
  error,
  onClose,
  onAction,
}: {
  ride: RideListItem | null;
  open: boolean;
  requests: PendingRideRequest[];
  busyRequestId: string | null;
  error: string | null;
  onClose: () => void;
  onAction: (requestId: string, action: "accept" | "decline") => void | Promise<void>;
}) {
  if (!open || !ride) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[80dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-black/10 border-b-0 bg-[#F7F4EF] p-4 sm:rounded-2xl sm:border-b sm:p-6">
        <h2 className="font-serif text-xl font-semibold text-[#1a1a1a]">Manage requests</h2>
        <p className="mt-1 text-[13px] text-[#888]">
          {ride.airport} · {ride.departureTime}
        </p>
        {error ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">{error}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-3">
          {requests.length === 0 ? (
            <p className="rounded-xl border border-black/10 bg-white px-3 py-4 text-[13px] text-[#666]">
              No pending requests right now.
            </p>
          ) : null}
          {requests.map((req) => (
            <div key={req.id} className="rounded-xl border border-black/10 bg-white p-3">
              <p className="text-[13px] font-semibold text-[#1a1a1a]">{req.requesterFirstName}</p>
              <p className="mt-1 text-[12px] text-[#777]">{new Date(req.createdAt).toLocaleString()}</p>
              {req.message ? <p className="mt-2 text-[13px] text-[#444]">"{req.message}"</p> : null}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busyRequestId === req.id}
                  onClick={() => void onAction(req.id, "accept")}
                  className="rounded-full bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-[#F7F4EF] disabled:opacity-60"
                >
                  {busyRequestId === req.id ? "Working..." : "Accept"}
                </button>
                <button
                  type="button"
                  disabled={busyRequestId === req.id}
                  onClick={() => void onAction(req.id, "decline")}
                  className="rounded-full border border-black/15 bg-white px-4 py-2 text-[12px] font-medium text-[#555] disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RidesDashboard({
  userName,
  initialRideGroups,
  initialJoinRequests = [],
}: {
  userName?: string | null;
  initialRideGroups: RideGroup[];
  initialJoinRequests?: { rideId: string; status: "PENDING" | "ACCEPTED" }[];
}) {
  const router = useRouter();
  const [rideGroups, setRideGroups] = useState(initialRideGroups);
  const [joinStatusByRideId, setJoinStatusByRideId] = useState<Record<string, "PENDING" | "ACCEPTED">>(() =>
    Object.fromEntries(initialJoinRequests.map((j) => [j.rideId, j.status]))
  );
  const [joinBusyRideId, setJoinBusyRideId] = useState<string | null>(null);
  const [leaveBusyRideId, setLeaveBusyRideId] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState<{ type: "error"; text: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All airports");
  const [postOpen, setPostOpen] = useState(false);
  const [postModalKey, setPostModalKey] = useState(0);
  const [postError, setPostError] = useState<string | null>(null);
  const [editingRide, setEditingRide] = useState<RideListItem | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [managingRide, setManagingRide] = useState<RideListItem | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRideRequest[]>([]);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsBusyId, setRequestsBusyId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setRideGroups(initialRideGroups);
  }, [initialRideGroups]);

  useEffect(() => {
    setJoinStatusByRideId(Object.fromEntries(initialJoinRequests.map((j) => [j.rideId, j.status])));
  }, [initialJoinRequests]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const reloadRidesFromApi = useCallback(async () => {
    try {
      const res = await fetch("/api/rides", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { groups?: unknown };
      if (Array.isArray(j.groups)) {
        setRideGroups(j.groups as RideGroup[]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void reloadRidesFromApi();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reloadRidesFromApi]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void reloadRidesFromApi();
      }
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [reloadRidesFromApi]);

  const filters: FilterOption[] = ["All airports", "JFK", "LGA", "EWR"];

  const filteredGroups = useMemo(
    () =>
      rideGroups
        .map((group) => ({
          ...group,
          rides:
            activeFilter === "All airports"
              ? group.rides
              : group.rides.filter((r) => r.airport === activeFilter),
        }))
        .filter((group) => group.rides.length > 0),
    [rideGroups, activeFilter]
  );

  const totalListed = useMemo(
    () => rideGroups.reduce((n, g) => n + g.rides.length, 0),
    [rideGroups]
  );

  const handleRequest = useCallback(async (rideId: string) => {
    setJoinMessage(null);
    setJoinBusyRideId(rideId);
    try {
      const res = await fetch(`/api/rides/${rideId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setJoinMessage({ type: "error", text: typeof j.error === "string" ? j.error : "Could not send request" });
        return;
      }
      setJoinStatusByRideId((prev) => ({ ...prev, [rideId]: "PENDING" }));
    } catch {
      setJoinMessage({ type: "error", text: "Network error" });
    } finally {
      setJoinBusyRideId(null);
    }
  }, []);

  const handleLeaveRide = useCallback(async (rideId: string) => {
    const ok = window.confirm("Leave this ride?");
    if (!ok) return;
    setJoinMessage(null);
    setLeaveBusyRideId(rideId);
    try {
      const res = await fetch(`/api/rides/${rideId}/join`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setJoinMessage({ type: "error", text: typeof j.error === "string" ? j.error : "Could not leave ride" });
        return;
      }
      setJoinStatusByRideId((prev) => {
        const next = { ...prev };
        delete next[rideId];
        return next;
      });
      await reloadRidesFromApi();
      router.refresh();
    } catch {
      setJoinMessage({ type: "error", text: "Network error" });
    } finally {
      setLeaveBusyRideId(null);
    }
  }, [reloadRidesFromApi, router]);

  const handlePostRide = useCallback(async (payload: PostRidePayload) => {
    setPostError(null);
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setPostError(typeof j.error === "string" ? j.error : "Could not post ride");
        return false;
      }
      await reloadRidesFromApi();
      router.refresh();
      return true;
    } catch {
      setPostError("Network error");
      return false;
    }
  }, [reloadRidesFromApi, router]);

  const handleEditRide = useCallback(
    async (payload: PostRidePayload) => {
      if (!editingRide) return false;
      setPostError(null);
      try {
        const res = await fetch(`/api/rides/${editingRide.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setPostError(typeof j.error === "string" ? j.error : "Could not update ride");
          return false;
        }
        setEditingRide(null);
        await reloadRidesFromApi();
        router.refresh();
        return true;
      } catch {
        setPostError("Network error");
        return false;
      }
    },
    [editingRide, reloadRidesFromApi, router]
  );

  const handleDeleteRide = useCallback(
    async (ride: RideListItem) => {
      const ok = window.confirm("Delete this ride? This cannot be undone.");
      if (!ok) return;
      setDeleteBusyId(ride.id);
      try {
        const res = await fetch(`/api/rides/${ride.id}`, { method: "DELETE" });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setJoinMessage({
            type: "error",
            text: typeof j.error === "string" ? j.error : "Could not delete ride",
          });
          return;
        }
        await reloadRidesFromApi();
        router.refresh();
      } catch {
        setJoinMessage({ type: "error", text: "Network error" });
      } finally {
        setDeleteBusyId(null);
      }
    },
    [reloadRidesFromApi, router]
  );

  const openManageRequests = useCallback(async (ride: RideListItem) => {
    setManagingRide(ride);
    setRequestsError(null);
    setPendingRequests([]);
    try {
      const res = await fetch(`/api/rides/${ride.id}/requests`, { cache: "no-store" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setRequestsError(typeof j.error === "string" ? j.error : "Could not load requests");
        return;
      }
      const j = (await res.json()) as { requests?: PendingRideRequest[] };
      setPendingRequests(Array.isArray(j.requests) ? j.requests : []);
    } catch {
      setRequestsError("Network error");
    }
  }, []);

  const handleManageAction = useCallback(
    async (requestId: string, action: "accept" | "decline") => {
      if (!managingRide) return;
      setRequestsBusyId(requestId);
      setRequestsError(null);
      try {
        const res = await fetch(`/api/rides/${managingRide.id}/requests/${requestId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setRequestsError(typeof j.error === "string" ? j.error : "Could not update request");
          return;
        }
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        await reloadRidesFromApi();
        router.refresh();
      } catch {
        setRequestsError("Network error");
      } finally {
        setRequestsBusyId(null);
      }
    },
    [managingRide, reloadRidesFromApi, router]
  );

  const initials = (userName ?? "CU")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#F7F4EF] font-sans">
      <PostRideModal
        key={postModalKey}
        open={postOpen}
        onClose={() => {
          setPostOpen(false);
          setEditingRide(null);
        }}
        onSubmit={handlePostRide}
        error={postError}
      />
      <PostRideModal
        key={editingRide?.id ?? "edit-closed"}
        open={Boolean(editingRide)}
        onClose={() => setEditingRide(null)}
        onSubmit={handleEditRide}
        error={postError}
        initialValue={
          editingRide
            ? {
                airport: editingRide.airport,
                terminal: editingRide.terminalInput,
                departureDate: editingRide.departureDate,
                time: editingRide.departureTime24,
                totalSpots: editingRide.totalSpots,
                genderPref: editingRide.genderPref,
              }
            : undefined
        }
        submitLabel="Save changes"
      />
      <ManageRequestsModal
        ride={managingRide}
        open={Boolean(managingRide)}
        requests={pendingRequests}
        busyRequestId={requestsBusyId}
        error={requestsError}
        onClose={() => setManagingRide(null)}
        onAction={handleManageAction}
      />

      <div
        className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, #C9DEFF 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-[320px] w-[320px] rounded-full opacity-35"
        style={{ background: "radial-gradient(circle, #D4EAC8 0%, transparent 70%)" }}
      />

      <nav className="animate-fade-down relative z-10 flex items-center justify-between gap-4 border-b border-black/[0.07] bg-[rgba(247,244,239,0.85)] px-4 py-5 backdrop-blur-md sm:px-8">
        <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-black/50">
          Columbia Carpools
        </span>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="touch-manipulation rounded-full border border-black/[0.12] bg-white px-3 py-1.5 text-[12px] font-medium text-[#444] transition-colors hover:border-[#4A7FD4]/50 hover:text-[#1a1a1a]"
          >
            Log out
          </button>
          <div className="flex h-8 w-8 cursor-default items-center justify-center rounded-full bg-[#1a1a1a] text-[12px] font-medium text-[#F7F4EF]">
            {initials || "CU"}
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-[900px] flex-1 px-4 py-6 pb-10 sm:px-6 sm:py-8 lg:px-8">
        {joinMessage?.type === "error" ? (
          <p
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800"
            role="alert"
          >
            {joinMessage.text}
          </p>
        ) : null}
        <div className="animate-fade-up mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="font-serif text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.02em] text-[#1a1a1a] sm:text-[32px] sm:leading-[1.1]">
              Available <span className="italic font-normal text-[#4A7FD4]">Rides</span>
            </h1>
            <p className="mt-1.5 text-[13px] font-light leading-snug text-[#888]">
              {totalListed} ride{totalListed !== 1 ? "s" : ""} listed in the next 12 months
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPostError(null);
              setPostModalKey((k) => k + 1);
              setPostOpen(true);
            }}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-3 text-[13px] font-medium text-[#F7F4EF] shadow-[0_2px_10px_rgba(26,26,26,0.15)] transition-all duration-150 active:translate-y-px sm:w-auto sm:py-2.5 sm:hover:-translate-y-px sm:hover:bg-[#2d2d2d] sm:hover:shadow-[0_5px_16px_rgba(26,26,26,0.2)] sm:active:translate-y-0"
          >
            <span className="text-base leading-none">+</span> Post a ride
          </button>
        </div>

        <div className="animate-fade-up mb-6 flex flex-wrap items-center gap-2 [animation-delay:100ms]">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`touch-manipulation rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 sm:px-4 ${
                activeFilter === f
                  ? "border-[#1a1a1a] bg-[#1a1a1a] text-[#F7F4EF]"
                  : "border-black/[0.12] bg-white text-[#555] hover:border-[#4A7FD4] hover:text-[#4A7FD4]"
              }`}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            className="order-last mt-1 w-full touch-manipulation rounded-full border border-black/[0.07] bg-white px-4 py-1.5 text-[12px] font-medium text-[#aaa] sm:order-none sm:ml-auto sm:mt-0 sm:w-auto"
          >
            Soonest first ↓
          </button>
        </div>

        <div className="animate-fade-up flex flex-col gap-3 [animation-delay:200ms]">
          {filteredGroups.length === 0 ? (
            <p className="rounded-2xl border border-black/[0.08] bg-white px-4 py-8 text-center text-[14px] leading-relaxed text-[#888] sm:px-6 sm:py-10">
              No upcoming rides in the next 12 months. Post one to get started.
            </p>
          ) : null}
          {filteredGroups.map((group) => (
            <div key={group.date}>
              <p className="mb-3 mt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#bbb]">
                {group.date}
              </p>
              <div className="flex flex-col gap-3">
                {group.rides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    joinStatus={joinStatusByRideId[ride.id]}
                    joinBusy={joinBusyRideId === ride.id}
                    leaveBusy={leaveBusyRideId === ride.id}
                    onRequest={handleRequest}
                    onLeave={handleLeaveRide}
                    onEdit={(r) => {
                      setPostError(null);
                      setEditingRide(r);
                    }}
                    onDelete={deleteBusyId ? undefined : handleDeleteRide}
                    onManageRequests={openManageRequests}
                    showManageRequests={isMounted}
                    showJoinActions={isMounted}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
