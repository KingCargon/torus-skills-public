# Production Notes

Things to know before this skill handles real client traffic.

## Meta temporary token vs production token

v1 of this skill was built and validated using Meta's **temporary test
access token**, which expires roughly every 24 hours. That's acceptable for
development and demos, but a production deployment on a temporary token
will start failing WhatsApp sends (401s, see
[META_WHATSAPP_SETUP.md](./META_WHATSAPP_SETUP.md)) within a day, with no
warning beyond the failed request.

**Before any client goes live:** switch to a Meta **System User token** (or
equivalent permanent WhatsApp Business setup). This is a hard requirement,
not an optimization — track it explicitly in
[CLIENT_DEPLOYMENT_CHECKLIST.md](./CLIENT_DEPLOYMENT_CHECKLIST.md).

## Security

- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security and must only
  ever be read in server-side code (`_lib/supabaseServer.ts`). Never import
  that file from a client component or expose the key via a
  `NEXT_PUBLIC_*` variable.
- `N8N_WEBHOOK_SECRET` is what stops third parties from POSTing fake leads
  (or arbitrary WhatsApp-triggering payloads) directly to your n8n webhook.
  Treat it like any other credential: unique per client, not reused, not
  logged.
- None of `RESEND_API_KEY`, `META_WHATSAPP_ACCESS_TOKEN`, or
  `N8N_WEBHOOK_SECRET` should ever appear in client-side bundles, logs sent
  to third parties, or committed files.

## Reliability / error handling

- `submit-lead.ts` treats the Supabase insert as required (a failure there
  fails the request) and the email + WhatsApp notifications as best-effort
  (`Promise.allSettled`) — a lead is never lost just because a notification
  channel is down, but notification failures are only visible in logs.
- For higher-stakes clients, consider adding retry logic or a dead-letter
  queue around the notification calls instead of fire-and-forget, and/or
  alerting on repeated notification failures (e.g. via Vercel log drains).

## Common issues

### Supabase insert failed
Check `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are set correctly for
the environment that's failing, and that the `leads` table/columns match
what `_lib/supabaseServer.ts` expects. RLS being enabled is expected and
fine — it's not the cause, since the service role key bypasses it; if RLS
*is* the cause, it usually means the wrong key (anon key instead of
service_role) is being used.

### n8n workflow takes the "false" branch
The `x-torus-webhook-secret` header sent by the API route doesn't match
what n8n's IF node expects. Confirm `N8N_WEBHOOK_SECRET` is identical on
both sides (watch for whitespace when copy-pasting), and that the workflow
wasn't re-imported with a stale credential reference.

### WhatsApp send returns 401
Almost always an expired Meta temporary test token (see above), or an
access token that doesn't have permission for the given
`META_WHATSAPP_PHONE_NUMBER_ID`. See
[META_WHATSAPP_SETUP.md](./META_WHATSAPP_SETUP.md).

### Vercel env vars changed but production behavior didn't change
Vercel does not retroactively apply env var changes to existing
deployments — a new deployment must be triggered. See
[VERCEL_ENV_VARS.md](./VERCEL_ENV_VARS.md).

### webhook-test URL used instead of the production webhook URL
`N8N_PRODUCTION_WEBHOOK_URL` must be n8n's `/webhook/...` URL, not
`/webhook-test/...`. The test URL only works while the workflow is open in
the editor with "Listen for test event" active — it silently does nothing
otherwise, which looks identical to "no leads are coming in" from the
outside. See [N8N_SETUP.md](./N8N_SETUP.md).
