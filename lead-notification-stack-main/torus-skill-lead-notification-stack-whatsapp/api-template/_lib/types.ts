// Shared types for the lead-notification-stack-whatsapp Torus Skill.
// Adapt the `source` union and `metadata` shape per client project.

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  /**
   * Identifies which surface/app generated the lead.
   * Example values: "torus-pricing-page", "barber-os-intake",
   * "cpa-quote-form", "cargon-io-contact", "restaurant-os-booking".
   * TODO(client): replace with an enum or string literal union for your project.
   */
  source: string;
  metadata?: Record<string, string | number | boolean | null>;
  submittedAt: string; // ISO 8601 timestamp, set server-side
}

// Raw, untrusted shape of the incoming request body before validation.
export interface SubmitLeadRequestBody {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  source?: unknown;
  metadata?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  payload: LeadPayload | null;
}

export interface SubmitLeadResult {
  success: boolean;
  leadId?: string;
  errors?: string[];
}

// Row shape persisted in Supabase. Adjust to match your `leads` table schema.
export interface LeadRow {
  id?: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  metadata: Record<string, unknown> | null;
  created_at?: string;
}

// Payload forwarded to the n8n production webhook.
export interface N8nLeadWebhookPayload {
  lead: LeadPayload;
  whatsappMessage: string;
}
