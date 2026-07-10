# n8n Workflow

This folder is where the exported n8n workflow JSON for this skill lives.

## Where to place the exported n8n JSON backup

The canonical, sanitized starting point ships in this folder as:

```
n8n-workflow/torus-lead-notification-stack-v1.json
```

It contains placeholders only (webhook secret, Meta access token, WhatsApp
phone number ID, recipient number, admin dashboard URL) — no real
credentials or client-specific values. Import it as-is into a new client's
n8n instance, then fill in real values as n8n **credentials**, never as
literal node parameters (see [SETUP.md](../SETUP.md) step 6).

If you export a newer version of the workflow from a working instance
before checking it back in here, **scrub it first**:
- Credential IDs/names that reveal real account details
- Any hardcoded webhook secret, Meta access token, or phone number ID
  (these should be n8n **credentials**, not values pasted into node
  parameters — if the export contains raw values, replace them with
  placeholders like `YOUR_META_ACCESS_TOKEN` before saving here)
- Production webhook URLs specific to a client's n8n instance
- Any client-specific admin dashboard URLs or business names

## Expected node structure

The production workflow this skill assumes looks like:

1. **Webhook (production)** — trigger node, method `POST`, path
   `torus-lead-notification` in the bundled workflow (rename per project if
   you prefer). Note the difference between n8n's
   **Test URL** (`/webhook-test/...`, only listens while the workflow editor
   is open and "Listen for test event" is active) and the **Production URL**
   (`/webhook/...`, live once the workflow is activated). This skill's API
   route must call the **production** URL — see
   [docs/N8N_SETUP.md](../docs/N8N_SETUP.md).
2. **IF node — validate `x-torus-webhook-secret`** — compares the incoming
   header against an n8n credential/environment value. True branch
   continues; false branch should end the workflow (e.g. respond 401) and
   is the "false branch" referenced in troubleshooting docs.
3. **Format WhatsApp message** — a Set node that builds the message text.
   In the bundled workflow it uses the pre-formatted `whatsappMessage`
   string sent by the API route (see `api-template/_lib/leadPayload.ts`)
   when present, and otherwise falls back to re-deriving the message from
   the generic `lead` object's fields (`name`, `email`, `phone`, `message`,
   `source`, `submittedAt` — matching `LeadPayload` in
   `api-template/_lib/types.ts`), so the workflow still works if something
   posts to it directly without going through the API template.
4. **HTTP Request — Meta WhatsApp Cloud API** — `POST` to
   `https://graph.facebook.com/v22.0/{META_WHATSAPP_PHONE_NUMBER_ID}/messages`
   with `Authorization: Bearer {META_WHATSAPP_ACCESS_TOKEN}` and a
   WhatsApp Cloud API message body. See
   [docs/META_WHATSAPP_SETUP.md](../docs/META_WHATSAPP_SETUP.md) for the
   exact payload shape and token requirements.
5. **Respond to Webhook** — return a simple success/failure JSON so the
   calling API route's `fetch` gets a clean status code.

## Credentials, not hardcoded values

Store the following as n8n credentials or environment variables referenced
by the workflow — never paste real values into node parameters that might
get exported/shared:

- Shared webhook secret (compared against `x-torus-webhook-secret`)
- Meta WhatsApp access token
- Meta WhatsApp phone number ID

## Testing this workflow

- While editing: use "Listen for test event" and call the **Test URL** from
  a local `curl` request to step through node output.
- Before considering it done: **activate** the workflow and call the
  **production URL** from the deployed API route (or a `curl` request) to
  confirm the end-to-end path works the same way it will for real traffic.
