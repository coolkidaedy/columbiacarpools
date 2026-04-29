"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link is no longer valid.",
  OAuthSignin: "Could not start sign-in with Google. Try again.",
  OAuthCallback: "Sign-in was interrupted. Try signing in again.",
  OAuthCreateAccount: "Could not create an account with this Google profile.",
  EmailCreateAccount: "Could not create an account.",
  Callback: "Something went wrong during sign-in. Try again.",
  OAuthAccountNotLinked: "This Google account is already linked to another login.",
  SessionRequired: "Please sign in to continue.",
  Default: "Sign-in failed. Try again.",
};

const fullText = "Columbia Carpools";

export default function LoginPageClient({
  csrfToken,
  openRideCount,
}: {
  csrfToken: string;
  openRideCount: number;
}) {
  const router = useRouter();
  const [displayedText, setDisplayedText] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [typewriterKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (code) {
      setAuthError(AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default);
      router.replace("/login");
    }
  }, [router]);


  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (i <= fullText.length) {
          setDisplayedText(fullText.slice(0, i));
          i += 1;
        } else if (intervalId) {
          clearInterval(intervalId);
        }
      }, 90);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [typewriterKey]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#F7F4EF] font-sans">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-[360px] w-[360px] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, #C9DEFF 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-[280px] w-[280px] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, #D4EAC8 0%, transparent 70%)" }}
      />

      <nav className="animate-fade-down relative z-10 flex items-center justify-between px-10 py-6">
        <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-black/50">
          Columbia Carpools
        </span>
        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] text-black/60">
          {openRideCount === 1 ? "1 open ride" : `${openRideCount} open rides`}
        </span>
      </nav>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 py-16 text-center">
        {authError ? (
          <p
            role="alert"
            className="animate-fade-up mb-6 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {authError}
          </p>
        ) : null}

        <h1 className="animate-fade-up mb-1.5 font-serif text-[clamp(42px,8vw,72px)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#1a1a1a]">
          Welcome to
          <span className="mt-1 block italic font-normal text-[#4A7FD4]">
            {displayedText}
            <span className="animate-blink ml-0.5 inline-block h-[0.85em] w-[3px] rounded-sm bg-[#4A7FD4] align-middle" />
          </span>
        </h1>

        <p className="animate-fade-up mt-7 max-w-[420px] text-base font-light leading-relaxed text-[#555] [animation-delay:150ms]">
          Find fellow{" "}
          <span className="font-medium text-[#1a1a1a]">Columbia & Barnard</span> students
          to split Ubers & Lyfts to the airport. Sign in to view and post rides.
        </p>

        <div className="animate-fade-up mt-11 flex flex-col items-center gap-3.5 [animation-delay:300ms]">
          <form action="/api/auth/signin/google" method="POST">
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value="/" />
            <button
              type="submit"
              className="flex items-center gap-2.5 rounded-full bg-[#1a1a1a] px-7 py-3.5 text-sm font-medium text-[#F7F4EF] shadow-[0_2px_12px_rgba(26,26,26,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2d2d2d] hover:shadow-[0_6px_20px_rgba(26,26,26,0.2)] active:translate-y-0"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </form>
          <span className="text-[11px] tracking-[0.03em] text-black/35">
            @columbia.edu and @barnard.edu only
          </span>
        </div>

        <p className="animate-fade-up mt-12 text-sm tracking-[0.02em] text-black/45 [animation-delay:450ms]">
          {openRideCount === 0
            ? "No open rides listed yet—be the first to post one"
            : openRideCount === 1
              ? "1 open ride to JFK, LGA, or EWR in the next 12 months"
              : `${openRideCount} open rides to JFK, LGA, and EWR in the next 12 months`}
        </p>
      </main>

      <footer className="animate-fade-up relative z-10 pb-6 text-center text-[11px] tracking-[0.04em] text-black/25 [animation-delay:550ms]">
        Made by students, for students.{" "}
        <Link href="/privacy-policy" className="underline-offset-2 hover:underline">
          Privacy Policy
        </Link>{" "}
        ·{" "}
        <Link href="/terms-of-service" className="underline-offset-2 hover:underline">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
