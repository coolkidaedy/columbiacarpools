import { prisma } from "@/lib/prisma";
import { publicRequesterLabel } from "@/lib/email/join-notifications";
import { submitJoinResponse } from "./actions";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function JoinRespondPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token.trim() : "";

  if (!token) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F7F4EF] px-4">
        <p className="text-center text-sm text-zinc-600">This link is missing a token. Open the link from your email.</p>
      </main>
    );
  }

  const jr = await prisma.joinRequest.findFirst({
    where: { token, status: "PENDING", tokenExpiry: { gt: new Date() } },
    include: {
      requester: { select: { name: true } },
      ride: { select: { airport: true, departureTime: true } },
    },
  });

  if (!jr) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F7F4EF] px-4">
        <p className="max-w-md text-center text-sm text-zinc-600">
          This request link is no longer valid. It may have expired or already been answered.
        </p>
      </main>
    );
  }

  const label = publicRequesterLabel(jr.requester.name);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#F7F4EF] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="font-serif text-xl font-semibold text-zinc-900">Ride request</h1>
        <p className="mt-2 text-sm text-zinc-600">
          <strong className="text-zinc-800">{label}</strong> asked to join your <strong>{jr.ride.airport}</strong> ride.
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          If you confirm, you’ll both receive an email with each other’s contact details. If you decline, they’ll be
          notified and won’t see your email or phone.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <form action={submitJoinResponse} className="flex-1">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="accept" />
            <button
              type="submit"
              className="w-full rounded-full bg-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-[#F7F4EF] hover:bg-zinc-800"
            >
              Confirm rider
            </button>
          </form>
          <form action={submitJoinResponse} className="flex-1">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="decline" />
            <button
              type="submit"
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Decline
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
