// Forwards the lead payload to the n8n production webhook, which then
// formats and sends the WhatsApp alert via Meta WhatsApp Cloud API.
// See docs/N8N_SETUP.md and n8n-workflow/README.md.

import type { LeadPayload, N8nLeadWebhookPayload } from "./types";
import { buildWhatsAppMessage } from "./leadPayload";

export async function sendLeadToN8n(payload: LeadPayload): Promise<void> {
  // TODO(client): must be the n8n PRODUCTION webhook URL (path starts with
  // /webhook/...), never the /webhook-test/... URL. See
  // docs/N8N_SETUP.md -> "Test URL vs production URL".
  const webhookUrl = process.env.N8N_PRODUCTION_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    throw new Error(
      "Missing N8N_PRODUCTION_WEBHOOK_URL or N8N_WEBHOOK_SECRET"
    );
  }

  const body: N8nLeadWebhookPayload = {
    lead: payload,
    whatsappMessage: buildWhatsAppMessage(payload),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // n8n's first workflow node must check this header matches
      // N8N_WEBHOOK_SECRET before doing anything else (see n8n-workflow/README.md).
      "x-torus-webhook-secret": webhookSecret,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `n8n webhook call failed (${response.status}): ${responseBody}`
    );
  }
}
