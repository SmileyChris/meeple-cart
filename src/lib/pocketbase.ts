import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { UserRecord } from './types/pocketbase';

// PocketBase URL - configurable via environment variable
// For production, set VITE_PUBLIC_POCKETBASE_URL in your build environment
const PB_URL =
  (import.meta.env.VITE_PUBLIC_POCKETBASE_URL as string | undefined) || 'http://127.0.0.1:8090';

// Create singleton PocketBase instance
export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation for better UX
pb.autoCancellation(false);

// Store original send method
const originalSend = pb.send.bind(pb);

// Override send to intercept network errors
pb.send = async (path, options) => {
  try {
    return await originalSend(path, options);
  } catch (err: any) {
    // Check for connection errors (status 0)
    if (err.status === 0) {
      // Inject friendly message into the error object
      // The SDK error object has a 'response' property which usually contains data
      if (!err.response) {
        err.response = {};
      }
      if (!err.response.data) {
        err.response.data = {};
      }
      err.response.data.message = 'Unable to connect to the server. Please check your internet connection and try again.';
      // We also update the main message for good measure, though validation often uses data.message
      err.message = 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    throw err;
  }
};

// Create reactive auth store
function createAuthStore() {
  const { subscribe, set } = writable<UserRecord | null>(null);

  return {
    subscribe,
    set,
    // Initialize auth from localStorage
    init: async () => {
      if (browser) {
        // If we have auth data, validate it's still valid by refreshing
        if (pb.authStore.isValid) {
          try {
            // Try to refresh the auth token - this will fail if user doesn't exist
            await pb.collection('users').authRefresh();
            set(pb.authStore.model as UserRecord);
          } catch (err) {
            // Auth is invalid (user deleted, database reset, etc.) - clear it
            console.warn('Stored auth is invalid, clearing:', err);
            pb.authStore.clear();
            set(null);
          }
        } else {
          set(null);
        }

        // Listen to auth changes and sync to our Svelte store
        pb.authStore.onChange(() => {
          const user = pb.authStore.isValid ? (pb.authStore.model as UserRecord) : null;
          set(user);
        });
      }
    },
    // Login helper
    login: async (email: string, password: string) => {
      const authData = await pb.collection('users').authWithPassword(email, password);
      set(authData.record as UserRecord);
      return authData;
    },
    // Logout helper
    logout: () => {
      pb.authStore.clear();
      set(null);
    },
    // Register helper
    register: async (data: {
      email: string;
      password: string;
      passwordConfirm: string;
      display_name: string;
    }) => {
      const record = await pb.collection('users').create(data);
      // Auto-login after registration
      await pb.collection('users').authWithPassword(data.email, data.password);
      set(pb.authStore.model as UserRecord);
      return record;
    },
  };
}

export const currentUser = createAuthStore();

// Initialize on browser
if (browser) {
  // Validate and initialize auth from localStorage
  currentUser.init().catch((err) => {
    console.error('Failed to initialize auth:', err);
  });
}
