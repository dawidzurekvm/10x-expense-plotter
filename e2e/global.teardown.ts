import { createClient } from '@supabase/supabase-js';
import type { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Database } from '../src/db/database.types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

/**
 * Global teardown for Playwright E2E tests.
 * Cleans up test data from Supabase database after all tests complete.
 * 
 * Tables cleaned (in order respecting foreign key constraints):
 * 1. series_exceptions (references entry_series)
 * 2. entry_series (self-referencing via parent_series_id)
 * 3. starting_balances
 */
async function globalTeardown(_config: FullConfig) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USER_EMAIL;
  const testUserPassword = process.env.E2E_USER_PASSWORD;
  const testUserId = process.env.E2E_USER_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '⚠️ SUPABASE_URL or SUPABASE_KEY not set. Skipping database cleanup.\n' +
      'Add them to your .env.test file to enable cleanup.'
    );
    return;
  }

  if (!testUserId) {
    console.warn(
      '⚠️ E2E_USER_ID not set. Skipping database cleanup.\n' +
      'Add it to your .env.test file to enable cleanup.'
    );
    return;
  }

  if (!testUserEmail || !testUserPassword) {
    console.warn(
      '⚠️ E2E_USER_EMAIL or E2E_USER_PASSWORD not set. Skipping database cleanup.\n' +
      'Add them to your .env.test file to enable cleanup.'
    );
    return;
  }

  console.log('🧹 Starting database cleanup...');

  // Create Supabase client with anon key
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Authenticate as test user to respect RLS policies
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (signInError) {
      console.error('❌ Error signing in as test user:', signInError.message);
      return;
    }

    const userId = testUserId;
    console.log(`📧 Cleaning up data for user: ${testUserEmail} (${userId})`);

    // Delete in order respecting foreign key constraints

    // 1. Delete series_exceptions (references entry_series.id)
    const { error: exceptionsError, count: exceptionsCount } = await supabase
      .from('series_exceptions')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (exceptionsError) {
      console.error('❌ Error deleting series_exceptions:', exceptionsError.message);
    } else {
      console.log(`  ✓ Deleted ${exceptionsCount ?? 0} series_exceptions`);
    }

    // 2. Delete entry_series (has self-reference via parent_series_id)
    // First, clear parent_series_id references to avoid FK constraint issues
    const { error: clearParentError } = await supabase
      .from('entry_series')
      .update({ parent_series_id: null })
      .eq('user_id', userId)
      .not('parent_series_id', 'is', null);

    if (clearParentError) {
      console.error('❌ Error clearing parent_series_id references:', clearParentError.message);
    }

    // Now delete all entry_series
    const { error: seriesError, count: seriesCount } = await supabase
      .from('entry_series')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (seriesError) {
      console.error('❌ Error deleting entry_series:', seriesError.message);
    } else {
      console.log(`  ✓ Deleted ${seriesCount ?? 0} entry_series`);
    }

    // 3. Delete starting_balances
    const { error: balancesError, count: balancesCount } = await supabase
      .from('starting_balances')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (balancesError) {
      console.error('❌ Error deleting starting_balances:', balancesError.message);
    } else {
      console.log(`  ✓ Deleted ${balancesCount ?? 0} starting_balances`);
    }

    // Sign out after cleanup
    await supabase.auth.signOut();

    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
  }
}

export default globalTeardown;

