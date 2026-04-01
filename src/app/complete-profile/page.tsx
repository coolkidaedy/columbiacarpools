import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfile } from "./actions";
import { CompleteProfileForm } from "./CompleteProfileForm";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Please select your school and class year.",
  schoolCustom: 'Please specify your school when "Other" is selected.',
  yearCustom: 'Please specify your class year when "Other" is selected.',
  communication: "Please choose how you’d like to be contacted.",
  phone: "Please enter your phone number for that contact option.",
  phoneInvalid: "Enter a valid phone number (at least 10 digits).",
  default: "Something went wrong. Please check the form and try again.",
};

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
      preferredCommunication: true,
    },
  });

  if (user?.school && user?.year && user?.preferredCommunication) {
    redirect("/");
  }

  const errorKey = params.error ?? "";
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.default) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Complete your profile</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Tell us your school, class year, and how you want other students to reach you about rides.
        </p>
        {errorMessage ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <CompleteProfileForm action={updateProfile} />
      </section>
    </main>
  );
}
