import { formatTime12hNyc } from "@/lib/nyc-datetime";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendTransactionalEmail } from "@/lib/email/mailer";

type CommUser = {
  name: string | null;
  email: string;
  phoneNumber: string | null;
  preferredCommunication: "EMAIL" | "PHONE" | "BOTH" | null;
};

/** First name only for match emails (after confirm). */
function displayFirstName(name: string | null): string {
  const n = name?.trim();
  if (n) return n.split(/\s+/)[0] ?? "Rider";
  return "Rider";
}

/** No email/phone/uni — used in the email to the driver before confirm. */
export function publicRequesterLabel(name: string | null): string {
  const n = name?.trim();
  if (n) return n.split(/\s+/)[0] ?? "A student";
  return "A student";
}

function rideSummaryHtml(airport: string, departure: Date): string {
  const when = formatTime12hNyc(departure);
  return `${airport} · Leaving campus at ${when} (EST)`;
}

function formatPhoneNumber(phoneNumber: string | null): string {
  const raw = phoneNumber?.trim();
  if (!raw) return "Not provided";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

function preferredContactLabel(pref: CommUser["preferredCommunication"]): string {
  if (pref === "PHONE") return "Phone";
  if (pref === "BOTH") return "Email or phone";
  return "Email";
}

function contactLine(name: string, user: CommUser): string {
  return `${name}'s contact Email: ${user.email} Phone: ${formatPhoneNumber(user.phoneNumber)}\nPreferred contact method: ${preferredContactLabel(user.preferredCommunication)}`;
}

const SAFETY_TIPS = `Before you meet up, a few tips:
* Confirm the exact pickup spot and time before the day of
* Meet somewhere public on campus, the main gates work well!
* Let a friend know who you're riding with and your expected departure time
* Trust your gut, if something feels off, it's okay to cancel`;

async function sendSafe(params: { to: string; subject: string; text: string }) {
  await sendTransactionalEmail(params);
}

/** B requested — email poster (A). No contact details for B. */
export async function sendPosterPendingRequestEmail(opts: {
  posterEmail: string;
  requesterFirstName: string;
  airport: string;
  departure: Date;
  token: string;
}) {
  const base = getAppBaseUrl();
  const link = `${base}/join/respond?token=${encodeURIComponent(opts.token)}`;
  await sendSafe({
    to: opts.posterEmail,
    subject: `New ride request · ${opts.airport}`,
    text: `New ride request:

${rideSummaryHtml(opts.airport, opts.departure)}

${opts.requesterFirstName} requested to join your ride.
Their contact details are hidden until you confirm.

Review and confirm or decline:
${link}`,
  });
}

/** After A confirms — both get full contact info. */
export async function sendMatchContactEmails(opts: {
  poster: CommUser;
  requester: CommUser;
  airport: string;
  departure: Date;
}) {
  const ride = rideSummaryHtml(opts.airport, opts.departure);
  const leaveUrl = `${getAppBaseUrl()}/`;

  await sendSafe({
    to: opts.poster.email,
    subject: `Confirmed rider · ${opts.airport}`,
    text: `You confirmed a spot on your ride, here's how to reach them.

${ride}

${displayFirstName(opts.requester.name)}'s contact
Email: ${opts.requester.email}
Phone: ${formatPhoneNumber(opts.requester.phoneNumber)}
Preferred method of communication: ${preferredContactLabel(opts.requester.preferredCommunication)}

${SAFETY_TIPS}`,
  });

  await sendSafe({
    to: opts.requester.email,
    subject: `You’re in · ${opts.airport}`,
    text: `Your spot is confirmed:

${ride}

${contactLine(displayFirstName(opts.poster.name), opts.poster)}

${SAFETY_TIPS}

If you no longer wish to be in the ride, please leave it from your dashboard:
${leaveUrl}`,
  });
}

/** A declined — notify B only (no driver contact). */
export async function sendRequesterDeclinedEmail(opts: {
  requesterEmail: string;
  airport: string;
  departure: Date;
}) {
  await sendSafe({
    to: opts.requesterEmail,
    subject: `Update on your ${opts.airport} ride request`,
    text: `Ride request update:

${rideSummaryHtml(opts.airport, opts.departure)}

The driver was not able to confirm your request this time.
You can browse other open rides and request again.`,
  });
}

export async function sendRideDeletedEmail(opts: {
  riderEmail: string;
  riderName: string | null;
  airport: string;
  departure: Date;
}) {
  await sendSafe({
    to: opts.riderEmail,
    subject: `Ride cancelled · ${opts.airport}`,
    text: `Hi ${displayFirstName(opts.riderName)},

Your confirmed ride has been deleted by the driver.

${rideSummaryHtml(opts.airport, opts.departure)}

Please check the dashboard for other available rides:
${getAppBaseUrl()}/`,
  });
}
