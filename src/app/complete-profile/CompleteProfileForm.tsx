"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
};

export function CompleteProfileForm({ action }: Props) {
  const [comm, setComm] = useState("");
  const showPhone = comm === "PHONE" || comm === "BOTH";

  return (
    <form action={action} className="mt-6 space-y-4">
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
        <label htmlFor="schoolCustom" className="mb-1 block text-sm font-medium text-zinc-800">
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

      <div>
        <label htmlFor="preferredCommunication" className="mb-1 block text-sm font-medium text-zinc-800">
          Preferred communication
        </label>
        <p className="mb-2 text-xs text-zinc-500">
          How should other students reach you about rides? Choose email only, phone only, or both—we’ll ask for your
          number if you pick phone or both.
        </p>
        <select
          id="preferredCommunication"
          name="preferredCommunication"
          required
          value={comm}
          onChange={(e) => setComm(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        >
          <option value="" disabled>
            Select one
          </option>
          <option value="EMAIL">Email</option>
          <option value="PHONE">Phone number</option>
          <option value="BOTH">Both (email or phone)</option>
        </select>
      </div>

      {showPhone ? (
        <div>
          <label htmlFor="phoneNumber" className="mb-1 block text-sm font-medium text-zinc-800">
            Phone number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required={showPhone}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            placeholder="e.g. (212) 555-0123"
          />
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Save and continue
      </button>
    </form>
  );
}
