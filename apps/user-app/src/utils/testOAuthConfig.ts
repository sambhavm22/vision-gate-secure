/**
 * OAuth Configuration Test Utility
 * 
 * This utility helps diagnose OAuth configuration issues
 * Run this in the browser console to check your setup
 */

import { supabase } from '@vision-gate/supabase/client';

export async function testOAuthConfig() {
  console.log('🔍 Testing OAuth Configuration...\n');

  // Test 1: Check Supabase client initialization
  console.log('✓ Test 1: Supabase Client');
  console.log('  URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('  Key exists:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  console.log('  Client initialized:', !!supabase);

  // Test 2: Check current session
  console.log('\n✓ Test 2: Current Session');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('  ❌ Session Error:', sessionError.message);
  } else {
    console.log('  Session exists:', !!session);
    if (session) {
      console.log('  User:', session.user.email);
      console.log('  Provider:', session.user.app_metadata.provider);
    }
  }

  // Test 3: Test OAuth URL generation
  console.log('\n✓ Test 3: OAuth URL Generation');
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        skipBrowserRedirect: true, // Don't actually redirect
      },
    });

    if (error) {
      console.error('  ❌ OAuth Error:', error);
      console.error('  Error Code:', error.code);
      console.error('  Error Message:', error.message);

      if (error.message.includes('not enabled')) {
        console.log('\n🚨 SOLUTION: Enable Google provider in Supabase Dashboard');
        console.log('   Go to: https://app.supabase.com/project/' + import.meta.env.VITE_SUPABASE_PROJECT_ID + '/auth/providers');
        console.log('   1. Find "Google" in the providers list');
        console.log('   2. Toggle "Enable Sign in with Google" to ON');
        console.log('   3. Enter your Client ID and Client Secret');
        console.log('   4. Click Save');
      }
    } else {
      console.log('  ✅ OAuth URL generated successfully');
      console.log('  Provider:', data.provider);
      console.log('  URL:', data.url);
    }
  } catch (err) {
    console.error('  ❌ Unexpected error:', err);
  }

  // Test 4: Check environment variables
  console.log('\n✓ Test 4: Environment Variables');
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_ID',
  ];

  requiredEnvVars.forEach(varName => {
    const value = import.meta.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ❌ ${varName}: NOT SET`);
    }
  });

  console.log('\n✓ Test Complete!');
  console.log('\nIf you see errors above, follow the suggested solutions.');
  console.log('For more help, see: TROUBLESHOOTING-OAUTH.md');
}

// Auto-run if in development mode
if (import.meta.env.DEV) {
  // Export to window for easy console access
  (window as any).testOAuthConfig = testOAuthConfig;
  console.log('💡 OAuth test utility loaded. Run testOAuthConfig() in console to test.');
}
