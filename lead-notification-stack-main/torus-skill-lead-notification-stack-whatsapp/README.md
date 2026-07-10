# torus-skill-lead-notification-stack-whatsapp

A reusable **Torus Skill**: a lead-capture and multi-channel notification
stack (Supabase + Resend + n8n + Meta WhatsApp Cloud API). Originally proven
on `pricing.torusai.io` Build 7.

> This is a general-purpose Torus Skill, not a pricing.torusai.io-only
> feature. It is designed to be dropped into any Torus client project that
> needs "capture a lead → store it → notify the team by email and WhatsApp."
> The workflow and API template themselves are fully generic — no
> pricing-page-specific values remain in the reusable stack.

## What this skill does

1. A form on a website/web app POSTs a lead to a server-side API route.
2. The API route validates the payload.
3. The lead is saved to a Supabase table.
4. An email notification is sent through Resend.
5. The lead payload is sent to an n8n production webhook.
6. n8n checks the `x-torus-webhook-secret` header before doing anything else.
7. n8n formats a WhatsApp-ready message from the lead data.
8. n8n sends a WhatsApp alert through the Meta WhatsApp Cloud API.

```
Browser form
   |
   v
POST /api/submit-lead  (this repo: api-template/submit-lead.ts)
   |
   |--> Supabase (insert lead row)             [api-template/_lib/supabaseServer.ts]
   |--> Resend (email notification)             [api-template/_lib/email.ts]
   |--> n8n production webhook                  [api-template/_lib/webhook.ts]
          |
          |--> validate x-torus-webhook-secret
          |--> format WhatsApp message
          |--> Meta WhatsApp Cloud API -> WhatsApp alert
```

## When to use this skill

Use it whenever a client project needs a lead/intake/quote/booking form to
reliably reach a human, on more than one channel, without building bespoke
notification plumbing each time. Known/expected use cases:

- Torus pricing page
- Barber OS
- CPA
- Cargon.io
- Restaurant OS
- Contractor OS
- Intake forms
- Quote forms
- Booking forms
- Client landing pages

## Required services

| Service | Purpose |
|---|---|
| Supabase | Persists the lead (source of truth) |
| Resend | Sends the email notification |
| n8n | Orchestrates the WhatsApp send + validates the webhook secret |
| Meta WhatsApp Cloud API | Sends the WhatsApp alert |
| Vercel | Hosts the API route and holds environment variables |

## Folder structure

```
torus-skill-lead-notification-stack-whatsapp/
  README.md                 <- you are here
  SETUP.md                  <- step-by-step setup for a new client project
  CHANGELOG.md
  .env.example
  n8n-workflow/
    README.md                <- where to put the exported n8n workflow JSON
  api-template/
    submit-lead.ts           <- API route handler
    _lib/
      email.ts               <- Resend integration
      webhook.ts              <- n8n webhook call
      supabaseServer.ts       <- server-only Supabase client + insert
      leadPayload.ts          <- validation + WhatsApp message formatting
      types.ts                <- shared types
  docs/
    RESEND_SETUP.md
    N8N_SETUP.md
    META_WHATSAPP_SETUP.md
    VERCEL_ENV_VARS.md
    CLIENT_DEPLOYMENT_CHECKLIST.md
    PRODUCTION_NOTES.md
```

## Quick start

See [SETUP.md](./SETUP.md) for the full walkthrough. Short version:

1. Copy `api-template/` into your project's API routes directory and adapt
   imports/paths for your framework (this template is written for Next.js
   App Router route handlers).
2. Copy `.env.example` to `.env.local`, fill in real values (never commit it).
3. Create the Supabase `leads` table (see [SETUP.md](./SETUP.md)).
4. Import the n8n workflow JSON (see [n8n-workflow/README.md](./n8n-workflow/README.md)).
5. Configure Meta WhatsApp Cloud API (see [docs/META_WHATSAPP_SETUP.md](./docs/META_WHATSAPP_SETUP.md)).
6. Set the same environment variables in Vercel (see [docs/VERCEL_ENV_VARS.md](./docs/VERCEL_ENV_VARS.md)) and redeploy.
7. Submit a test lead and confirm: Supabase row created, email received,
   WhatsApp message received.

## Important notes

- **No secrets are included in this skill.** Every credential, token, phone
  number, and URL in this repo is a placeholder. Fill in real values only in
  your local `.env.local` / your hosting provider's environment variable
  settings — never in files that get committed.
- **Never use the Supabase `service_role` key in frontend/client code.** It
  must only be read in server-side code (API routes / route handlers), as
  shown in `api-template/_lib/supabaseServer.ts`.
- **v1 uses a Meta temporary test token.** This is fine for development but
  expires (~24 hours). Production deployments must switch to a Meta System
  User token or an equivalent permanent WhatsApp Business token. See
  [docs/META_WHATSAPP_SETUP.md](./docs/META_WHATSAPP_SETUP.md) and
  [docs/PRODUCTION_NOTES.md](./docs/PRODUCTION_NOTES.md).

## Troubleshooting

Full detail lives in [docs/PRODUCTION_NOTES.md](./docs/PRODUCTION_NOTES.md)
and the relevant per-service doc. Common issues at a glance:

| Symptom | Likely cause | Where to look |
|---|---|---|
| Supabase insert failed | Missing env vars, wrong table/column names, RLS blocking service role | [SETUP.md](./SETUP.md), [PRODUCTION_NOTES.md](./docs/PRODUCTION_NOTES.md) |
| n8n workflow goes down the "false" branch | Webhook secret mismatch or missing header | [docs/N8N_SETUP.md](./docs/N8N_SETUP.md) |
| WhatsApp send returns 401 | Expired/invalid Meta token or wrong phone number ID | [docs/META_WHATSAPP_SETUP.md](./docs/META_WHATSAPP_SETUP.md) |
| Vercel env vars changed but nothing changed in prod | Env var changes don't apply until redeploy | [docs/VERCEL_ENV_VARS.md](./docs/VERCEL_ENV_VARS.md) |
| n8n webhook call fails intermittently / silently does nothing in prod | Using the `/webhook-test/...` URL instead of the `/webhook/...` production URL | [docs/N8N_SETUP.md](./docs/N8N_SETUP.md) |
