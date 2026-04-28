type PageProps = {
  searchParams: Promise<{ outcome?: string }>;
};

const COPY: Record<string, { title: string; body: string }> = {
  accepted: {
    title: "Rider confirmed",
    body: "We’ve emailed both of you with contact details. You can close this tab.",
  },
  declined: {
    title: "Request declined",
    body: "The requester has been notified. You can close this tab.",
  },
  expired: {
    title: "Link expired",
    body: "This link is no longer valid. If you still need to respond, ask them to send another request from the app.",
  },
  full: {
    title: "Ride is full",
    body: "There wasn’t enough space left to confirm this rider.",
  },
  invalid: {
    title: "Something went wrong",
    body: "We couldn’t process this response. Use the link from your email, or open the app.",
  },
  error: {
    title: "Something went wrong",
    body: "Please try again or use the Columbia Carpools app.",
  },
};

export default async function JoinResultPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const outcome = typeof params.outcome === "string" ? params.outcome : "";
  const message = COPY[outcome] ?? COPY.invalid;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#F7F4EF] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <h1 className="font-serif text-xl font-semibold text-zinc-900">{message.title}</h1>
        <p className="mt-3 text-sm text-zinc-600">{message.body}</p>
      </div>
    </main>
  );
}
