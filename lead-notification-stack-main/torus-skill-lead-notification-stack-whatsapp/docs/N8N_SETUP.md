# n8n Setup

n8n receives the lead payload from the API route, validates a shared
secret, formats the WhatsApp message, and calls the Meta WhatsApp Cloud API.

## What this covers

- Importing the workflow JSON
- Setting the production webhook URL and webhook secret
- Test URL vs production URL (a very common source of "it works locally,
  nothing happens in production" bugs)
- Testing the workflow

## 1. Import the workflow

1. In your n8n instance: Workflows -> Import from File.
2. Select the sanitized JSON from
   [../n8n-workflow/lead-notification-stack-whatsapp.workflow.json](../n8n-workflow/README.md)
   (or build the workflow following the node structure in that README if no
   export exists yet for this project).
3. Re-attach credentials (webhook secret, Meta WhatsApp token) using this
   n8n instance's credential store — imported JSON does not carry
   credentials with it.

## 2. Set the webhook secret

The workflow's first real node after the Webhook trigger must be an IF (or
Switch) node comparing the incoming `x-torus-webhook-secret` header against
a secret value:

- Store the secret as an n8n credential or environment variable, referenced
  by the IF node — do not hardcode it into the node's parameters.
- The same value must be set as `N8N_WEBHOOK_SECRET` in the calling
  project's environment (Vercel + local `.env.local`).
- Generate a long random string for this (e.g. `openssl rand -hex 32`), not
  a guessable word.

## 3. Test URL vs production URL

This is the single most common deployment mistake with this skill.

n8n gives every Webhook node **two** URLs:

- **Test URL** — looks like `.../webhook-test/your-path`. Only receives
  requests while you have the workflow open in the editor with "Listen for
  test event" active. Great for building the workflow, useless in
  production — requests silently do nothing once you close the editor.
- **Production URL** — looks like `.../webhook/your-path`. Only live once
  the workflow is **activated** (top-right toggle in the n8n editor).

`N8N_PRODUCTION_WEBHOOK_URL` in the API route's environment must always be
the **production** URL. If leads are being validated and saved to Supabase
correctly but WhatsApp messages never arrive, check this first.

## 4. Activate the workflow

Toggle the workflow to **Active**. An inactive workflow's production URL
returns errors or does nothing, even though the workflow "looks" fine in
the editor.

## 5. Testing

- **During development**: open the workflow, click "Listen for test event,"
  and send a request to the Test URL (`curl` or the running API route
  temporarily pointed at it). Step through each node's output in the
  editor.
- **Before go-live**: activate the workflow and send a request to the
  Production URL directly, to confirm it behaves the same way outside the
  editor.
- Check **Executions** (left sidebar) for a history of every webhook call,
  including which branch (true/false) was taken and any node errors.

## Troubleshooting

- **Workflow goes down the "false" branch every time** — the
  `x-torus-webhook-secret` header sent by the API route doesn't match the
  value the IF node compares against. Confirm both sides reference the
  exact same secret (watch for trailing whitespace/newlines when pasting).
- **Nothing happens in production, worked fine while testing** — you're
  using the Test URL in `N8N_PRODUCTION_WEBHOOK_URL`, or the workflow isn't
  activated.
- **Execution shows success but no WhatsApp message arrives** — check the
  Meta HTTP Request node's response body in the execution log; a 200 from
  n8n doesn't guarantee Meta accepted the message (see
  [META_WHATSAPP_SETUP.md](./META_WHATSAPP_SETUP.md)).
