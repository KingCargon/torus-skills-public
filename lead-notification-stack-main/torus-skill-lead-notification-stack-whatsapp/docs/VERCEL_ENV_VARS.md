# Vercel Environment Variables

The API route (`api-template/submit-lead.ts` and `_lib/*`) reads all of its
configuration from environment variables. This doc covers setting them in
Vercel specifically, since that's where the most common deployment mistake
happens.

## Required variables

Same set as `.env.example`, set per environment (Production, Preview,
Development) as appropriate:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
LEAD_NOTIFICATION_TO_EMAIL
N8N_PRODUCTION_WEBHOOK_URL
N8N_WEBHOOK_SECRET
META_WHATSAPP_ACCESS_TOKEN
META_WHATSAPP_PHONE_NUMBER_ID
META_WHATSAPP_RECIPIENT_NUMBER
```

None of these should have a `NEXT_PUBLIC_` prefix — they must stay
server-side only.

## Setting them

Via the dashboard: Project -> Settings -> Environment Variables -> add each
key/value, choosing which environments (Production/Preview/Development) it
applies to.

Via the CLI:
```
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ...repeat per variable, and per environment as needed
```

To pull them down locally for `vercel dev` / matching production config:
```
vercel env pull .env.local
```

## The #1 troubleshooting issue: redeploy required

**Changing an environment variable in Vercel does not affect deployments
that already exist.** A running Production deployment keeps using whatever
values were baked in at build/deploy time. If you update a value (e.g.
rotate `N8N_WEBHOOK_SECRET` or fix a typo in `SUPABASE_URL`), you must
trigger a **new deployment** for it to take effect:

```
vercel --prod
```

or push a commit / use "Redeploy" in the dashboard. If something is
misbehaving in production right after an env var change and you haven't
redeployed yet, that's almost always the cause.

## Preview vs Production environments

If a client project uses Preview deployments for staging, make sure Preview
has its **own** values for anything environment-specific — in particular
`N8N_PRODUCTION_WEBHOOK_URL` (a staging n8n workflow, if one exists) and
`META_WHATSAPP_RECIPIENT_NUMBER` (so test traffic doesn't page a real
on-call/team number). Otherwise preview deployments will notify the same
production channels as real traffic.

## Troubleshooting

- **Env vars set correctly but production still behaves like the old
  value** — redeploy (see above).
- **Works in Preview, breaks in Production (or vice versa)** — check the
  variable was added to *both* environments, not just one.
- **`vercel env pull` doesn't match what's live** — `vercel env pull`
  defaults to Development-environment values; pass `--environment=production`
  if you need to inspect what Production actually has set.
