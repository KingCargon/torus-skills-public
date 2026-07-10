# Changelog

All notable changes to this Torus Skill are documented here.

## [1.1.0] - 2026-07-09

### Added

- Exported n8n workflow (`n8n-workflow/torus-lead-notification-stack-v1.json`),
  sanitized for safe storage: real webhook secret, Meta access token,
  WhatsApp phone number ID, and recipient phone number were all replaced
  with placeholders.

### Changed

- Genericized the workflow for reuse across client projects: the webhook
  path was renamed from the pricing-page-specific `torus-pricing-lead` to
  `torus-lead-notification`, and the hardcoded
  `https://pricing.torusai.io/admin` link in the WhatsApp message was
  replaced with a `YOUR_ADMIN_DASHBOARD_URL` placeholder.
- README now frames `pricing.torusai.io` Build 7 strictly as the original
  prototype the skill was proven on — the workflow and API template
  themselves carry no pricing-page-specific values.
- The workflow's `Format Lead Message` node no longer references
  pricing-calculator-specific fields (`business_name`, `business_type`,
  `selected_os`/`selected_package`, `estimated_monthly_total`). It now uses
  the pre-formatted `whatsappMessage` string sent by the API route when
  present, falling back to the generic `LeadPayload` fields (`name`,
  `email`, `phone`, `message`, `source`, `submittedAt`) so the workflow
  matches the same lead shape used across the rest of this skill.

## [1.0.0] - 2026-07-09

### Added

- Initial extraction of the lead notification stack as a standalone,
  reusable Torus Skill, based on the working `pricing.torusai.io` Build 7
  implementation.
- API template (`api-template/`): `submit-lead.ts` route handler plus
  `_lib/leadPayload.ts`, `_lib/supabaseServer.ts`, `_lib/email.ts`,
  `_lib/webhook.ts`, `_lib/types.ts`.
- Documentation set: `README.md`, `SETUP.md`, `.env.example`,
  `n8n-workflow/README.md`, and `docs/` (Resend, n8n, Meta WhatsApp Cloud
  API, Vercel env vars, client deployment checklist, production notes).

### Known limitations

- v1 is validated against a Meta **temporary test token**, which expires
  approximately every 24 hours. Production deployments must move to a Meta
  System User token or equivalent permanent WhatsApp Business setup before
  going live with a client. See `docs/PRODUCTION_NOTES.md`.
- The bundled n8n workflow JSON (`n8n-workflow/torus-lead-notification-stack-v1.json`)
  ships with placeholder credentials only. Real values (webhook secret,
  Meta access token, WhatsApp phone number ID, recipient number) must be
  re-entered per client project — see `n8n-workflow/README.md`.
