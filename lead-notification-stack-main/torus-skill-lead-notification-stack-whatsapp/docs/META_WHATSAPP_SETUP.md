# Meta WhatsApp Cloud API Setup

The final step of the flow: n8n calls the Meta WhatsApp Cloud API to send
the lead alert as a WhatsApp message.

## What this covers

- Creating a Meta app with WhatsApp enabled
- Test token vs production (System User) token — **read this before going
  live with any client**
- The values n8n's HTTP Request node needs
- Testing and the 401 troubleshooting path

## 1. Create a Meta app

1. Go to Meta for Developers and create an app with the **WhatsApp**
   product added.
2. Under WhatsApp -> API Setup, note the **Phone Number ID** — this is
   `META_WHATSAPP_PHONE_NUMBER_ID`.
3. Add a recipient test number (Meta requires recipients to be verified
   test numbers until the app/business is fully approved) —
   `META_WHATSAPP_RECIPIENT_NUMBER`.

## 2. v1: temporary test token (development only)

Meta's API Setup page provides a **temporary access token** that expires
approximately every 24 hours. This is what v1 of this skill was built and
validated against. It is fine for local development and demos, but:

> **Do not ship a client to production on a temporary test token.** It will
> silently stop working within a day and every WhatsApp send will start
> returning 401s until someone notices and regenerates it manually.

## 3. Production: Meta System User token (required before go-live)

Before a client project goes to production:

1. Create a Meta Business System User (Business Settings -> Users -> System
   Users) with access to the WhatsApp app.
2. Generate a **permanent** access token for that System User, scoped to
   `whatsapp_business_messaging` (and `whatsapp_business_management` if
   managing templates/numbers programmatically).
3. Complete Meta's business verification if required for the target
   messaging volume/recipient set.
4. Replace `META_WHATSAPP_ACCESS_TOKEN` with this permanent token in every
   environment (see [VERCEL_ENV_VARS.md](./VERCEL_ENV_VARS.md) and the n8n
   credential store).

See [PRODUCTION_NOTES.md](./PRODUCTION_NOTES.md) for the full production
checklist item on this.

## 4. Message payload shape (used by the n8n HTTP Request node)

```
POST https://graph.facebook.com/v22.0/{META_WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer {META_WHATSAPP_ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "{META_WHATSAPP_RECIPIENT_NUMBER}",
  "type": "text",
  "text": { "body": "{{ $json.whatsappMessage }}" }
}
```

Note: outside Meta's 24-hour customer service window, freeform text
messages to a given recipient may be rejected — sending to your own internal
team number for lead alerts (not the lead's number) avoids this in practice,
since your team can message the business number to open/keep the window
active. If you need to notify numbers outside that window reliably, use an
approved WhatsApp message **template** instead of freeform text.

## 5. Testing

```
curl -X POST "https://graph.facebook.com/v22.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"15555550123","type":"text","text":{"body":"Test message"}}'
```

A `200` with a `messages` array containing a `message id` means Meta
accepted the message.

## Troubleshooting

- **401 Unauthorized** — the most common cause is an expired temporary test
  token (see section 2 — they expire roughly every 24h). Regenerate a test
  token for development, or switch to a System User token for anything
  longer-lived. Also double check the token has the right scopes and
  belongs to the same Meta app as `META_WHATSAPP_PHONE_NUMBER_ID`.
- **400 with a recipient/phone number error** — the recipient number isn't
  registered as a test recipient (pre-verification) or is missing the
  country code.
- **Message accepted by Meta (200) but recipient never receives it** —
  usually the 24-hour session window issue described above; switch to a
  template message, or have the recipient message the business number
  first to reopen the window.
