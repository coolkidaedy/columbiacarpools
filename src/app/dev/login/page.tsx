import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isDevEmailSigninConfigured } from "@/lib/auth";
import DevLoginClient from "./DevLoginClient";

export default async function DevLoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    redirect("/");
  }

  if (!isDevEmailSigninConfigured()) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#F7F4EF] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="font-serif text-xl font-semibold text-zinc-900">Dev sign-in isn’t enabled</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Add <code className="rounded bg-zinc-100 px-1 py-0.5 text-[13px]">DEV_SIGNIN_EMAIL=your@email.com</code> to{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-[13px]">.env</code>, then{" "}
            <strong>restart</strong> <code className="text-[13px]">npm run dev</code>. After that, this page will show the
            sign-in form.
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            The email you type on the next screen must match that value exactly (case doesn’t matter).
          </p>
        </div>
      </main>
    );
  }

  return <DevLoginClient />;
}
