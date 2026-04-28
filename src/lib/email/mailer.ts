import type { ReactNode } from "react";
import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (resendClient) return resendClient;
  resendClient = new Resend(apiKey);
  return resendClient;
}

export function getFromEmailAddress(): string {
  return (process.env.EMAIL_FROM ?? "Columbia Carpools <rides@aedinpereira.dev>").trim();
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  react?: ReactNode;
}): Promise<void> {
  const resend = getResendClient();
  const from = getFromEmailAddress();
  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] RESEND_API_KEY missing; cannot send:", params.subject, "→", params.to);
    } else {
      console.warn("[email] RESEND_API_KEY missing; skip:", params.subject, "→", params.to);
    }
    return;
  }
  if (!params.text && !params.html && !params.react) {
    console.error("[email] Missing email body:", params.subject, "→", params.to);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
      react: params.react,
    });
    if (error) {
      console.error("[email] Resend send failed:", error);
    }
  } catch (e) {
    console.error("[email] Resend send failed:", e);
  }
}
