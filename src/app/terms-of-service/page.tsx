import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-dvh bg-[#F7F4EF] px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-3xl font-semibold text-[#1a1a1a]">Terms of Service</h1>
        <p className="mt-2 text-sm text-[#666]">Effective Date: April 28, 2026</p>

        <div className="mt-6 space-y-4 text-sm leading-7 text-[#333]">
          <h2 className="text-base font-semibold text-[#1a1a1a]">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Columbia Carpools (&quot;the App&quot;), you agree to these Terms of Service.
            If you do not agree, do not use the App.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">2. Eligibility</h2>
          <p>
            The App is for current Columbia University and Barnard College community members with valid
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5">@columbia.edu</code> or
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5">@barnard.edu</code> Google accounts.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">3. Description of Service</h2>
          <p>
            Columbia Carpools coordinates shared airport rides. The App does not provide transportation
            services and is not a rideshare operator or taxi company.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">4. User Responsibilities</h2>
          <p>
            You agree to provide accurate information, treat others respectfully, honor confirmed arrangements,
            coordinate safely, and avoid unlawful or harmful use.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">5. Safety</h2>
          <p>
            Meet in public places, inform someone of your plans, and trust your instincts. You may cancel if
            you feel unsafe. The App is not responsible for incidents during rides arranged through the
            platform.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">6. Contact Information Sharing</h2>
          <p>
            Once a request is confirmed, both matched users receive contact information to coordinate the ride.
            This information may only be used for ride coordination.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">7. No Guarantee of Rides</h2>
          <p>
            We do not guarantee ride availability or completion. We are not liable for missed flights or
            disruptions from cancellation or changes.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">8. Prohibited Conduct</h2>
          <p>
            Prohibited behavior includes harassment, false listings, misuse of personal data, commercial use,
            bypassing eligibility, and impersonation.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">9. Termination</h2>
          <p>
            We may suspend or terminate access if these Terms are violated or if conduct is harmful to others.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">10. Disclaimer of Warranties</h2>
          <p>
            The App is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">11. Limitation of Liability</h2>
          <p>
            To the fullest extent allowed by law, we are not liable for indirect or consequential damages
            resulting from use of the App or rides arranged through it.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">12. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use after updates are posted means
            acceptance of the new Terms.
          </p>
          <h2 className="pt-2 text-base font-semibold text-[#1a1a1a]">13. Contact</h2>
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
