/** Public base URL for links in emails (no trailing slash). */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXTAUTH_URL ?? process.env.APP_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
