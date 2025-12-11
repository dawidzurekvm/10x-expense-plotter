import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { type AstroCookies } from "astro";

import type { Database } from "./database.types.ts";

// Server-side env vars (not exposed to client)
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Client-side env vars (must be prefixed with PUBLIC_ to be exposed to browser)
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

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
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

