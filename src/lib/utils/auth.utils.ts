import { DEFAULT_USER_ID } from "../../db/supabase.client";

/**
 * Helper function to get authenticated user from Supabase session
 * TODO: Enable authentication when auth is implemented
 */
export async function getAuthenticatedUser(): Promise<{
  userId: string;
} | null> {
  // Temporarily disabled - using default user for development
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession();
  //
  // if (!session || !session.user) {
  //   return null;
  // }
  //
  // return { userId: session.user.id };

  // Return default user ID for development
  return { userId: DEFAULT_USER_ID };
}
