"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COMM_CHOICES = new Set(["EMAIL", "PHONE", "BOTH"]);

function countDigits(s: string): number {
  return s.replace(/\D/g, "").length;
}

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.toLowerCase();

  const school = String(formData.get("school") ?? "").trim();
  const year = String(formData.get("year") ?? "").trim();
  const schoolCustomInput = String(formData.get("schoolCustom") ?? "").trim();
  const yearCustomInput = String(formData.get("yearCustom") ?? "").trim();
  const preferredCommunication = String(formData.get("preferredCommunication") ?? "").trim();
  const phoneNumberInput = String(formData.get("phoneNumber") ?? "").trim();

  if (!school || !year) {
    redirect("/complete-profile?error=missing");
  }

  if (!COMM_CHOICES.has(preferredCommunication)) {
    redirect("/complete-profile?error=communication");
  }

  const schoolCustom = school === "Other" ? schoolCustomInput : null;
  const yearCustom = year === "Other" ? yearCustomInput : null;

  if (school === "Other" && !schoolCustom) {
    redirect("/complete-profile?error=schoolCustom");
  }
  if (year === "Other" && !yearCustom) {
    redirect("/complete-profile?error=yearCustom");
  }

  let phoneNumber: string | null = null;
  if (preferredCommunication === "PHONE" || preferredCommunication === "BOTH") {
    if (!phoneNumberInput) {
      redirect("/complete-profile?error=phone");
    }
    if (countDigits(phoneNumberInput) < 10) {
      redirect("/complete-profile?error=phoneInvalid");
    }
    phoneNumber = phoneNumberInput;
  }

  await prisma.user.update({
    where: { email },
    data: {
      school,
      year,
      schoolCustom,
      yearCustom,
      preferredCommunication: preferredCommunication as "EMAIL" | "PHONE" | "BOTH",
      phoneNumber,
    },
  });

  redirect("/");
}
