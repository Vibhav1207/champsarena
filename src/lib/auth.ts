'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Hook to handle authentication checks and redirects
 * Returns authentication status and loading state
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle automatic redirect to login when unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = window.location.href;
      // Replace current location to avoid back-loop to login
      router.replace(`/login?callback=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router]);

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading'
  };
}

/**
 * Helper function to check auth status in async functions
 * Useful for server actions or async event handlers
 */
export async function checkAuthAndRedirect() {
  const result = await getSession();
  const session = result?.user;

  if (!session) {
    if (typeof window !== 'undefined') {
      const callbackUrl = window.location.href;
      window.location.href = `/login?callback=${encodeURIComponent(callbackUrl)}`;
    }
    return false;
  }

  return true;
}

// Helper to get session (need to import this properly in actual implementation)
// This is a placeholder - in practice, you'd import getSession from 'next-auth/react'
async function getSession() {
  // Implementation would be: import { getSession } from 'next-auth/react';
//   return getSession();
  return { user: null }; // Placeholder
}