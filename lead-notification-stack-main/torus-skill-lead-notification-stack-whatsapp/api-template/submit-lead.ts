// Torus Skill: lead-notification-stack-whatsapp
//
// Server-side route handler that receives a lead submission and fans it out
// to Supabase (storage), Resend (email), and n8n (WhatsApp alert via Meta
// WhatsApp Cloud API).
//
// TODO(client): place this file at app/api/submit-lead/route.ts in a Next.js
// App Router project (or adapt the export to your framework's route handler
// signature, e.g. Express req/res or Remix action).
//
// This file intentionally keeps orchestration linear and readable: validate,
// persist, notify. Each side effect is isolated in ./_lib so it can be
// swapped out per client project.

import { NextRequest, NextResponse } from "next/server";
import { validateLeadPayload } from "./_lib/leadPayload";
import { insertLead } from "./_lib/supabaseServer";
import { sendLeadNotificationEmail } from "./_lib/email";
import { sendLeadToN8n } from "./_lib/webhook";
import type { SubmitLeadRequestBody, SubmitLeadResult } from "./_lib/types";

export async function POST(request: NextRequest) {
  let body: SubmitLeadRequestBody;

  try {
    body = (await request.json()) as SubmitLeadRequestBody;
  } catch {
    return NextResponse.json<SubmitLeadResult>(
      { success: false, errors: ["Request body must be valid JSON"] },
      { status: 400 }
    );
  }

  const { valid, errors, payload } = validateLeadPayload(body);

  if (!valid || !payload) {
    return NextResponse.json<SubmitLeadResult>(
      { success: false, errors },
      { status: 422 }
    );
  }

  let leadId: string;
  try {
    leadId = await insertLead(payload);
  } catch (error) {
    console.error("[submit-lead] Supabase insert failed:", error);
    return NextResponse.json<SubmitLeadResult>(
      { success: false, errors: ["Failed to save lead"] },
      { status: 500 }
    );
  }

  // Email and WhatsApp notifications are best-effort: the lead is already
  // saved, so a notification failure should not fail the request for the
  // end user. Log failures so they surface in Vercel logs / monitoring.
  // TODO(client): if notifications are business-critical, consider a retry
  // queue instead of fire-and-forget.
  const notificationResults = await Promise.allSettled([
    sendLeadNotificationEmail(payload),
    sendLeadToN8n(payload),
  ]);

  notificationResults.forEach((result, index) => {
    if (result.status === "rejected") {
      const label = index === 0 ? "email" : "n8n webhook";
      console.error(`[submit-lead] ${label} notification failed:`, result.reason);
    }
  });

  return NextResponse.json<SubmitLeadResult>({ success: true, leadId });
}
