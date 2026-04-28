"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendMatchContactEmails, sendRequesterDeclinedEmail } from "@/lib/email/join-notifications";

const userSelect = {
  email: true,
  name: true,
  phoneNumber: true,
  preferredCommunication: true,
} as const;

export async function submitJoinResponse(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();

  if (!token || (action !== "accept" && action !== "decline")) {
    redirect("/join/result?outcome=invalid");
  }

  const jr = await prisma.joinRequest.findFirst({
    where: {
      token,
      status: "PENDING",
      tokenExpiry: { gt: new Date() },
    },
    include: {
      ride: {
        select: {
          id: true,
          airport: true,
          departureTime: true,
          maxRiders: true,
          poster: { select: userSelect },
        },
      },
      requester: { select: userSelect },
    },
  });

  if (!jr) {
    redirect("/join/result?outcome=expired");
  }

  if (action === "decline") {
    await prisma.joinRequest.update({
      where: { id: jr.id },
      data: { status: "DECLINED" },
    });
    await sendRequesterDeclinedEmail({
      requesterEmail: jr.requester.email,
      airport: jr.ride.airport,
      departure: jr.ride.departureTime,
    });
    redirect("/join/result?outcome=declined");
  }

  const passengerSlots = Math.max(0, jr.ride.maxRiders - 1);

  const outcome = await prisma.$transaction(async (tx) => {
    const current = await tx.joinRequest.findUnique({ where: { id: jr.id } });
    if (!current || current.status !== "PENDING") return "stale" as const;
    const acceptedCount = await tx.joinRequest.count({
      where: { rideId: jr.rideId, status: "ACCEPTED" },
    });
    if (acceptedCount >= passengerSlots) return "full" as const;
    await tx.joinRequest.update({
      where: { id: jr.id },
      data: { status: "ACCEPTED" },
    });
    return "ok" as const;
  });

  if (outcome === "full") redirect("/join/result?outcome=full");
  if (outcome === "stale") redirect("/join/result?outcome=expired");

  await sendMatchContactEmails({
    poster: jr.ride.poster,
    requester: jr.requester,
    airport: jr.ride.airport,
    departure: jr.ride.departureTime,
  });

  redirect("/join/result?outcome=accepted");
}
