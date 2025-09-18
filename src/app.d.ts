import type PocketBase from 'pocketbase';
import type { UserRecord } from '$lib/types/pocketbase';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      pb: PocketBase;
      user: UserRecord | null;
    }

    interface PageData {
      user: UserRecord | null;
    }

    // interface Error {}
    // interface Platform {}
  }
}

export {};
