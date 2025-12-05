import type { Database } from '../../db/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper function to get authenticated user from Supabase session
 * TODO: Enable authentication when auth is implemented
 */
export async function getAuthenticatedUser(supabase: SupabaseClient<Database>): Promise<{
  userId: string;
} | null> {
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || !session.user) {
     return null;
   }
  
  return { userId: session.user.id };
}
