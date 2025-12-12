/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

// Cloudflare runtime environment bindings
interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_FUNCTIONS_URL?: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<CloudflareEnv>;

declare global {
  namespace App {
    interface Locals extends Runtime {
      supabase: SupabaseClient<Database>;
      user: {
        email: string | undefined;
        id: string;
      } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  // Optional: Override for local Edge Functions (e.g., http://127.0.0.1:54321)
  readonly SUPABASE_FUNCTIONS_URL?: string;
  // Public env vars (exposed to client-side code)
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
