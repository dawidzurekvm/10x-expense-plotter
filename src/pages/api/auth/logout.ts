import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals }) => {
  // Use supabase client from middleware (has Cloudflare runtime env)
  const supabase = locals.supabase;

  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(null, { status: 200 });
};

