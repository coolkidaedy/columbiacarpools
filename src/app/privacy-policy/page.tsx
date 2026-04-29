import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-[#F7F4EF] px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#666]">Effective Date: April 28, 2026</p>

        <div className="mt-6 space-y-4 text-sm leading-7 text-[#333]">
          <p>
            Columbia Carpools (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your
            privacy. This Privacy Policy explains what information we collect, how we use it, and how we
            protect it.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">1. Information We Collect</h2>
          <p>
            When you sign in with Google, we collect your name and email address from your Google account,
            plus your Columbia or Barnard UNI derived from your email address.
          </p>
          <p>
            When you use the App, we also collect ride listings you post, join requests and status, optional
            profile information (school, graduation year, phone number), and report submissions.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">2. How We Use Your Information</h2>
          <p>
            We use data to authenticate users, verify affiliation, display listings, process join and
            confirmation flow, send transactional emails, share contact information upon confirmed match, and
            enforce Terms of Service.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">3. Information Shared With Other Users</h2>
          <p>
            Ride details (airport, terminal, departure time, spots, and gender preference) are visible in the
            feed. Contact information is shared only upon confirmed match. UNI and school may appear on
            listings for trust and safety.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">4. Information We Do Not Share</h2>
          <p>
            We do not sell personal information, share data with advertisers, or reveal contact information
            before mutual confirmation.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">5. Third-Party Services</h2>
          <p>
            We use Google OAuth (authentication), Resend (transactional email delivery), Supabase (database
            hosting), and Vercel (application hosting). Each provider has its own privacy policy.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">6. Data Retention</h2>
          <p>
            Account information is retained while accounts are active. Ride records may be retained for
            record-keeping. You may request account and data deletion by contacting us.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">7. Security</h2>
          <p>
            We use reasonable technical safeguards including HTTPS and database access controls. No system can
            guarantee absolute security.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">8. Your Rights</h2>
          <p>
            You may request access, correction, deletion, and withdrawal of consent for optional data uses by
            contacting us.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">9. Children&apos;s Privacy</h2>
          <p>
            This App is for university users and is not directed to children under 13. We do not knowingly
            collect data from children under 13.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy. Continued use after updates are posted means you accept the
            updated policy.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">11. Contact</h2>
          <p>If you have questions, contact: ap4672@columbia.edu</p>
        </div>

        <p className="mt-8 text-sm">
          <Link href="/login" className="text-[#4A7FD4] underline-offset-2 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
