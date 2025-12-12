import { defineMiddleware } from "astro:middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/auth/callback",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;

  // Get Cloudflare runtime env (available in production on Cloudflare Pages)
  const runtimeEnv = locals.runtime?.env as Record<string, string> | undefined;

  // Create server-side supabase client with runtime env for Cloudflare
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    runtimeEnv,
  });

  // Store in locals for use in endpoints/pages
  // Cast to fix type mismatch between @supabase/ssr client and supabase-js client type in locals
  locals.supabase = supabase as unknown as SupabaseClient<Database>;
  locals.user = null; // Default to null

  // IMPORTANT: Always get user session first before any other operations
  // This refreshes the session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  }

  // Skip auth check for public paths
  if (PUBLIC_PATHS.some(path => url.pathname.startsWith(path))) {
    // If user is authenticated and tries to visit login/register, redirect to dashboard
    if (user && (url.pathname === "/login" || url.pathname === "/register")) {
        return redirect("/");
    }
    return next();
  }

  if (!user) {
    // Redirect to login for protected routes
    return redirect("/login");
  }

  return next();
});
