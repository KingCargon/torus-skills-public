# Resend Setup

Resend sends the internal email notification when a new lead comes in
(`api-template/_lib/email.ts`).

## What this covers

- Creating a Resend account/API key
- Verifying a sending domain
- The environment variables this skill needs
- Testing email delivery

## 1. Create an account and API key

1. Sign up at Resend (or use the client/organization's existing account).
2. Create an API key scoped to sending (Dashboard -> API Keys).
3. Store it as `RESEND_API_KEY` — never commit this value, only put it in
   `.env.local` and your hosting provider's environment variable settings.

## 2. Verify a sending domain

`RESEND_FROM_EMAIL` must be an address on a domain verified in Resend
(Dashboard -> Domains -> Add Domain, then add the DNS records Resend gives
you — typically SPF/DKIM TXT records — at your DNS provider).

Until the domain shows **Verified**, sends from that domain will fail or
land in spam. Use a placeholder like `notifications@your-verified-domain.example`
until a real domain is set up for the client project.

## 3. Environment variables

```
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=notifications@your-verified-domain.example
LEAD_NOTIFICATION_TO_EMAIL=internal-team@your-company.example
```

`LEAD_NOTIFICATION_TO_EMAIL` is who receives the notification — typically an
internal team inbox, not the lead's own email address.

## 4. Testing

Call the API route locally or in production (see [../SETUP.md](../SETUP.md))
and confirm an email arrives at `LEAD_NOTIFICATION_TO_EMAIL`. Resend's
dashboard (Logs) also shows delivery status per send and is the fastest way
to debug a failure.

## Troubleshooting

- **401/403 from Resend** — `RESEND_API_KEY` is missing, revoked, or from
  the wrong Resend project/account.
- **Email never arrives, no error thrown** — check spam, and check the
  domain's verification status; unverified domains often silently fail or
  get filtered.
- **"from" address rejected** — `RESEND_FROM_EMAIL` isn't on a verified
  domain in this Resend account.
