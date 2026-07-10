// Sends an email notification for a new lead via Resend.
// See docs/RESEND_SETUP.md for account setup and domain verification.

import type { LeadPayload } from "./types";

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendLeadNotificationEmail(
  payload: LeadPayload
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  // TODO(client): "from" must be an address on a domain verified in Resend.
  const from = process.env.RESEND_FROM_EMAIL;
  // TODO(client): where internal notifications get sent for this project.
  const to = process.env.LEAD_NOTIFICATION_TO_EMAIL;

  if (!apiKey || !from || !to) {
    throw new Error(
      "Missing RESEND_API_KEY, RESEND_FROM_EMAIL, or LEAD_NOTIFICATION_TO_EMAIL"
    );
  }

  const subject = `New lead: ${payload.name} (${payload.source})`;
  const html = `
    <h2>New lead received</h2>
    <p><strong>Source:</strong> ${payload.source}</p>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    ${payload.phone ? `<p><strong>Phone:</strong> ${payload.phone}</p>` : ""}
    ${payload.message ? `<p><strong>Message:</strong> ${payload.message}</p>` : ""}
    <p><strong>Submitted:</strong> ${payload.submittedAt}</p>
  `;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${body}`);
  }
}
