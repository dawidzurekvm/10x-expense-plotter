import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { type AstroCookies } from "astro";

import type { Database } from "./database.types.ts";

// Client-side env vars (must be prefixed with PUBLIC_ to be exposed to browser)
// These are inlined at build time and safe to use at module level
const publicSupabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

// Helper to get env var from Cloudflare runtime or fallback to import.meta.env
function getEnvVar(name: string, runtimeEnv?: Record<string, string>): string {
  // First try Cloudflare runtime env (available at request time)
  if (runtimeEnv && name in runtimeEnv) {
    return runtimeEnv[name];
  }
  // Fallback to import.meta.env (for local dev or build-time vars)
  return (import.meta.env as Record<string, string>)[name] ?? "";
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  runtimeEnv?: Record<string, string>;
}) => {
  // Get env vars at request time from Cloudflare runtime
  const supabaseUrl = getEnvVar("SUPABASE_URL", context.runtimeEnv);
  const supabaseAnonKey = getEnvVar("SUPABASE_KEY", context.runtimeEnv);
  
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          context.cookies.set(name, value, options),
        );
      },
    },
  });
};

export const createSupabaseBrowserClient = () => {
  return createBrowserClient<Database>(publicSupabaseUrl, publicSupabaseAnonKey);
};

