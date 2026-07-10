// Validates the raw request body and formats the WhatsApp-ready message.
// This is the file most projects will customize first: field names,
// required fields, and the WhatsApp message copy will differ per client.

import type {
  LeadPayload,
  SubmitLeadRequestBody,
  ValidationResult,
} from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadPayload(
  body: SubmitLeadRequestBody
): ValidationResult {
  const errors: string[] = [];

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const message =
    typeof body.message === "string" ? body.message.trim() : undefined;
  // TODO(client): default source per project, e.g. "torus-pricing-page".
  const source =
    typeof body.source === "string" && body.source.length > 0
      ? body.source
      : "unspecified-source";
  const metadata =
    body.metadata && typeof body.metadata === "object"
      ? (body.metadata as Record<string, unknown>)
      : undefined;

  if (!name) errors.push("name is required");
  if (!email) errors.push("email is required");
  if (email && !EMAIL_REGEX.test(email)) errors.push("email is invalid");

  if (errors.length > 0) {
    return { valid: false, errors, payload: null };
  }

  const payload: LeadPayload = {
    name,
    email,
    phone,
    message,
    source,
    metadata: metadata as LeadPayload["metadata"],
    submittedAt: new Date().toISOString(),
  };

  return { valid: true, errors: [], payload };
}

// Builds the plain-text message sent through WhatsApp.
// TODO(client): adjust copy/branding per project (e.g. "New Barber OS lead").
export function buildWhatsAppMessage(payload: LeadPayload): string {
  const lines = [
    `New lead from ${payload.source}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
  ];

  if (payload.phone) lines.push(`Phone: ${payload.phone}`);
  if (payload.message) lines.push(`Message: ${payload.message}`);

  lines.push(`Submitted: ${payload.submittedAt}`);

  return lines.join("\n");
}
