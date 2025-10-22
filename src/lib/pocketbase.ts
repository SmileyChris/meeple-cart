import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { UserRecord } from './types/pocketbase';

// PocketBase URL - configurable via environment variable
// For production, set VITE_PUBLIC_POCKETBASE_URL in your build environment
const PB_URL =
  (import.meta.env.VITE_PUBLIC_POCKETBASE_URL as string | undefined) ||
  'http://127.0.0.1:8090';

// Create singleton PocketBase instance
export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation for better UX
pb.autoCancellation(false);

// Create reactive auth store
function createAuthStore() {
  const { subscribe, set } = writable<UserRecord | null>(null);

  return {
    subscribe,
    set,
    // Initialize auth from localStorage
    init: () => {
      if (browser) {
        pb.authStore.loadFromCookie(document.cookie);
        const user = pb.authStore.isValid ? (pb.authStore.model as UserRecord) : null;
        set(user);

        // Listen to auth changes
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
  currentUser.init();
}
