# Client Deployment Checklist

Run through this before handing a project using this skill to a client, or
before considering a new integration "done."

## Supabase

- [ ] Dedicated Supabase project (or dedicated table) for this client —
      not sharing a `leads` table across unrelated clients.
- [ ] `leads` table created with the expected columns (see [../SETUP.md](../SETUP.md)).
- [ ] Row Level Security enabled on the table.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` confirmed present only in server-side env
      vars, never in any `NEXT_PUBLIC_*` variable or client bundle.

## Resend

- [ ] Sending domain verified in Resend for this client.
- [ ] `RESEND_FROM_EMAIL` uses the verified domain.
- [ ] `LEAD_NOTIFICATION_TO_EMAIL` points at the correct internal team inbox
      for this client (not a placeholder/test address).

## n8n

- [ ] Workflow imported into the client's (or the agency's shared) n8n
      instance.
- [ ] Webhook secret rotated to a fresh, unique value for this client — not
      reused from another project.
- [ ] Workflow **activated**.
- [ ] `N8N_PRODUCTION_WEBHOOK_URL` uses the `/webhook/...` production path,
      confirmed by testing (not `/webhook-test/...`).

## Meta WhatsApp Cloud API

- [ ] Using a Meta System User (permanent) token, not a temporary test
      token — see [META_WHATSAPP_SETUP.md](./META_WHATSAPP_SETUP.md).
- [ ] `META_WHATSAPP_PHONE_NUMBER_ID` and recipient number confirmed correct
      for this client's WhatsApp Business number/team.
- [ ] Sent a real test message end-to-end and confirmed delivery.

## Vercel

- [ ] All required env vars set for Production (see
      [VERCEL_ENV_VARS.md](./VERCEL_ENV_VARS.md)).
- [ ] Redeployed after setting/changing env vars.
- [ ] No secrets committed to the repo (`.env.local` is gitignored; only
      `.env.example` with placeholders is tracked).

## End-to-end test

- [ ] Submitted a real test lead through the actual client-facing form (not
      just `curl`).
- [ ] Confirmed the row appears in Supabase.
- [ ] Confirmed the email notification arrived.
- [ ] Confirmed the WhatsApp message arrived on the client's real
      notification number.
- [ ] Removed/flagged any test lead rows so they don't pollute the client's
      real data.

## Handoff

- [ ] Client (or internal owner) knows where the Meta token needs periodic
      attention/rotation if not yet on a permanent System User token.
- [ ] Client knows which n8n instance owns this workflow and who has access
      to it.
