import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
}

type CommUser = {
  name: string | null;
  email: string;
  phoneNumber: string | null;
  preferredCommunication: "EMAIL" | "PHONE" | "BOTH" | null;
};

interface RequestReviewEmailProps {
  requesterFirstName: string;
  airport: string;
  rideSummary: string;
  reviewLink: string;
}

interface MatchContactEmailProps {
  introText: string;
  otherPartyLabel: string;
  rideSummary: string;
  contact: CommUser;
}

interface DeclinedEmailProps {
  airport: string;
  rideSummary: string;
}

const wrapperStyle: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  color: "#1f2937",
  lineHeight: 1.5,
};

export function EmailTemplate({ firstName }: EmailTemplateProps) {
  return (
    <div style={wrapperStyle}>
      <h1>Welcome, {firstName}!</h1>
    </div>
  );
}

export function RequestReviewEmailTemplate({
  requesterFirstName,
  airport,
  rideSummary,
  reviewLink,
}: RequestReviewEmailProps) {
  return (
    <div style={wrapperStyle}>
      <p>
        {requesterFirstName} requested to join your carpool to <strong>{airport}</strong>.
      </p>
      <p style={{ color: "#6b7280", fontSize: 14 }}>{rideSummary}</p>
      <p>Their contact details are hidden until you confirm.</p>
      <p>
        <a
          href={reviewLink}
          style={{
            display: "inline-block",
            marginTop: 12,
            padding: "10px 18px",
            background: "#1a1a1a",
            color: "#f7f4ef",
            textDecoration: "none",
            borderRadius: 999,
          }}
        >
          Review request
        </a>
      </p>
      <p style={{ fontSize: 12, color: "#888" }}>If the button does not work: {reviewLink}</p>
    </div>
  );
}

function ContactLines({ user }: { user: CommUser }) {
  return (
    <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
      <li>Email: {user.email}</li>
      {user.phoneNumber?.trim() ? <li>Phone: {user.phoneNumber.trim()}</li> : null}
      {user.preferredCommunication && user.preferredCommunication !== "EMAIL" ? (
        <li>
          Preferred:{" "}
          {user.preferredCommunication === "PHONE"
            ? "Phone"
            : user.preferredCommunication === "BOTH"
              ? "Email or phone"
              : "Email"}
        </li>
      ) : null}
    </ul>
  );
}

export function MatchContactEmailTemplate({
  introText,
  otherPartyLabel,
  rideSummary,
  contact,
}: MatchContactEmailProps) {
  return (
    <div style={wrapperStyle}>
      <p>{introText}</p>
      <p style={{ color: "#6b7280", fontSize: 14 }}>{rideSummary}</p>
      <p>
        <strong>{otherPartyLabel} contact:</strong>
      </p>
      <ContactLines user={contact} />
      <p>Reach out to coordinate pickup.</p>
    </div>
  );
}

export function DeclinedEmailTemplate({ airport, rideSummary }: DeclinedEmailProps) {
  return (
    <div style={wrapperStyle}>
      <p>
        The driver was not able to confirm your request for the <strong>{airport}</strong> ride.
      </p>
      <p style={{ color: "#6b7280", fontSize: 14 }}>{rideSummary}</p>
      <p>You can browse other open rides and request again.</p>
    </div>
  );
}
