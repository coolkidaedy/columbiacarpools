import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function updateProfile(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const school = String(formData.get("school") ?? "").trim();
  const year = String(formData.get("year") ?? "").trim();
  const schoolCustomInput = String(formData.get("schoolCustom") ?? "").trim();
  const yearCustomInput = String(formData.get("yearCustom") ?? "").trim();

  if (!school || !year) {
    redirect("/complete-profile?error=missing");
  }

  const schoolCustom = school === "Other" ? schoolCustomInput : null;
  const yearCustom = year === "Other" ? yearCustomInput : null;

  if (school === "Other" && !schoolCustom) {
    redirect("/complete-profile?error=schoolCustom");
  }
  if (year === "Other" && !yearCustom) {
    redirect("/complete-profile?error=yearCustom");
  }

  await prisma.user.update({
    where: { email: session.user.email.toLowerCase() },
    data: {
      school,
      year,
      schoolCustom,
      yearCustom,
    },
  });

  redirect("/");
}

export default async function CompleteProfilePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: {
      school: true,
      year: true,
    },
  });

  if (user?.school && user?.year) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Complete your profile
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Tell us your school and class year to continue.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Please fill out all required fields.
          </p>
        ) : null}
        <form action={updateProfile} className="mt-6 space-y-4">
          <div>
            <label htmlFor="school" className="mb-1 block text-sm font-medium text-zinc-800">
              School
            </label>
            <select
              id="school"
              name="school"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              defaultValue=""
            >
              <option value="" disabled>
                Select your school
              </option>
              <option value="CC">Columbia College (CC)</option>
              <option value="SEAS">SEAS</option>
              <option value="Barnard">Barnard</option>
              <option value="GS">General Studies (GS)</option>
              <option value="Graduate">Graduate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="schoolCustom"
              className="mb-1 block text-sm font-medium text-zinc-800"
            >
              If school is &quot;Other&quot;, specify
            </label>
            <input
              id="schoolCustom"
              name="schoolCustom"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              placeholder="School name"
            />
          </div>

          <div>
            <label htmlFor="year" className="mb-1 block text-sm font-medium text-zinc-800">
              Class year
            </label>
            <select
              id="year"
              name="year"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              defaultValue=""
            >
              <option value="" disabled>
                Select your class year
              </option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="Graduate">Graduate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="yearCustom" className="mb-1 block text-sm font-medium text-zinc-800">
              If year is &quot;Other&quot;, specify
            </label>
            <input
              id="yearCustom"
              name="yearCustom"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              placeholder="Class year"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save and continue
          </button>
        </form>
      </section>
    </main>
  );
}
