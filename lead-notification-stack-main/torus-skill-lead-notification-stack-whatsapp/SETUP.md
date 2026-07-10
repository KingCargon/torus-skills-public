# Setup Guide

Step-by-step instructions for wiring this Torus Skill into a new client
project. Read [README.md](./README.md) first for the overall architecture.

## 1. Prerequisites

- A Next.js (App Router) project deployed on Vercel, or any framework where
  you can adapt `api-template/submit-lead.ts` to a server-side route handler.
- Accounts/access for: Supabase, Resend, an n8n instance (cloud or
  self-hosted), and a Meta Developer app with WhatsApp Cloud API enabled.
- `@supabase/supabase-js` installed in the target project:
  ```
  npm install @supabase/supabase-js
  ```

## 2. Copy the API template

Copy `api-template/` into your project, e.g.:

```
app/api/submit-lead/route.ts        <- from api-template/submit-lead.ts
app/api/submit-lead/_lib/*.ts       <- from api-template/_lib/*.ts
```

Adjust import paths if your project structure differs. If you are not using
Next.js App Router, adapt the `POST` export in `submit-lead.ts` to your
framework's handler signature (Express `(req, res)`, Remix `action`, etc.) —
the `_lib/*` files are framework-agnostic and can be reused as-is.

## 3. Create the Supabase table

Minimum schema for the `leads` table used by `_lib/supabaseServer.ts`:

```sql
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text,
  source text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

Row Level Security (RLS) should be **enabled** on this table. The API route
uses the `service_role` key server-side, which bypasses RLS by design — no
public policies are required for this flow to work, which also means no
client code can read/write this table directly (by design).

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill in real values. Never commit
`.env.local`. See each variable's purpose in `.env.example`'s comments, and
[docs/VERCEL_ENV_VARS.md](./docs/VERCEL_ENV_VARS.md) for setting the same
values in Vercel.

## 5. Resend setup

See [docs/RESEND_SETUP.md](./docs/RESEND_SETUP.md). You need a verified
sending domain and an API key before `RESEND_FROM_EMAIL` will deliver.

## 6. Import the n8n workflow

See [n8n-workflow/README.md](./n8n-workflow/README.md) and
[docs/N8N_SETUP.md](./docs/N8N_SETUP.md). In short:

1. Export the working workflow JSON from an existing instance (see the
   "Where to place the exported n8n JSON" note in `n8n-workflow/README.md`),
   or build a new workflow following the node structure documented there.
2. Import it into the target n8n instance.
3. Set the shared webhook secret and Meta WhatsApp credentials as n8n
   credentials/environment variables (do not hardcode them in the workflow).
4. Activate the workflow so the **production** webhook URL is live.
5. Copy the production webhook URL into `N8N_PRODUCTION_WEBHOOK_URL`.

## 7. Configure Meta WhatsApp Cloud API

See [docs/META_WHATSAPP_SETUP.md](./docs/META_WHATSAPP_SETUP.md). You need a
phone number ID and an access token available to the n8n workflow's HTTP
request node.

## 8. Set Vercel environment variables and redeploy

See [docs/VERCEL_ENV_VARS.md](./docs/VERCEL_ENV_VARS.md). Set every variable
from `.env.example` for the relevant Vercel environments (Production,
Preview, Development as needed), then **trigger a new deployment** — Vercel
does not apply env var changes to already-running deployments.

## 9. Test locally

```
npm run dev
curl -X POST http://localhost:3000/api/submit-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","email":"test@example.com","source":"local-test"}'
```

Confirm:
- A row appears in the Supabase `leads` table.
- An email arrives at `LEAD_NOTIFICATION_TO_EMAIL`.
- The n8n workflow execution log shows a successful run.
- A WhatsApp message arrives at the configured test recipient.

## 10. Test production

Repeat the same `curl` request against the deployed Vercel URL. Use the
[docs/CLIENT_DEPLOYMENT_CHECKLIST.md](./docs/CLIENT_DEPLOYMENT_CHECKLIST.md)
before handing the project to a client.

## Troubleshooting

See [docs/PRODUCTION_NOTES.md](./docs/PRODUCTION_NOTES.md) for the full list.
Quick pointers:

- **Supabase insert failed** — check `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  are set and correct, and that the table/column names match step 3.
- **n8n workflow goes down the "false"/error branch** — the
  `x-torus-webhook-secret` header didn't match; confirm `N8N_WEBHOOK_SECRET`
  matches what the workflow's IF node compares against.
- **WhatsApp 401** — the Meta access token expired or is invalid; see
  [docs/META_WHATSAPP_SETUP.md](./docs/META_WHATSAPP_SETUP.md).
- **Vercel env vars changed but production didn't change** — redeploy after
  editing env vars.
- **Nothing arrives in production but local testing worked** — check
  `N8N_PRODUCTION_WEBHOOK_URL` uses `/webhook/...`, not `/webhook-test/...`.
