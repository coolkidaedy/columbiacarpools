import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      name: true,
      school: true,
      year: true,
    },
  });

  if (!user?.school || !user?.year) {
    redirect("/complete-profile");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <section className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome{user.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="mt-3 text-zinc-600">
          Your profile is complete. You can now access the app.
        </p>
      </section>
    </main>
  );
}
