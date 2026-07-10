// Server-only Supabase client for persisting leads.
//
// IMPORTANT: This file must NEVER be imported from client components or any
// code bundled to the browser. It uses the Supabase service_role key, which
// bypasses Row Level Security. Only import this from server-side route
// handlers / server actions.

import { createClient } from "@supabase/supabase-js";
import type { LeadPayload, LeadRow } from "./types";

function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// TODO(client): replace "leads" with your actual table name if different,
// and confirm the column names match your schema (see SETUP.md).
const LEADS_TABLE = "leads";

export async function insertLead(payload: LeadPayload): Promise<string> {
  const supabase = getSupabaseServerClient();

  const row: LeadRow = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    message: payload.message ?? null,
    source: payload.source,
    metadata: payload.metadata ?? null,
  };

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .insert(row)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return data.id as string;
}
