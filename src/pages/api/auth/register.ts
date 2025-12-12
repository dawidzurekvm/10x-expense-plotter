import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

// Helper to get env var from Cloudflare runtime or fallback to import.meta.env
function getEnvVar(name: string, runtimeEnv?: Record<string, string>): string {
  if (runtimeEnv && name in runtimeEnv) {
    return runtimeEnv[name];
  }
  return (import.meta.env as Record<string, string>)[name] ?? "";
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
      });
    }

    // Get Cloudflare runtime env (available in production on Cloudflare Pages)
    const runtimeEnv = locals.runtime?.env as Record<string, string> | undefined;

    // Create a Supabase client without session persistence to prevent auto-login
    const supabase = createClient(
      getEnvVar("SUPABASE_URL", runtimeEnv),
      getEnvVar("SUPABASE_KEY", runtimeEnv),
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
