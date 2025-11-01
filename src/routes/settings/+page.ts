import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';
import { get } from 'svelte/store';
import { currentUser } from '$lib/pocketbase';
import type { VerifierSettingsRecord } from '$lib/types/pocketbase';

export const load: PageLoad = async () => {
  // Check if user is authenticated
  const user = get(currentUser);

  if (!user) {
    throw redirect(302, '/login?redirect=/settings');
  }

  try {
    // Fetch verifier settings if they exist
    let verifierSettings: VerifierSettingsRecord | null = null;

    try {
      const settingsResult = await pb
        .collection('verifier_settings')
        .getFirstListItem<VerifierSettingsRecord>(`user = "${user.id}"`);
      verifierSettings = settingsResult;
    } catch (err) {
      // No verifier settings yet - that's okay
      console.log('No verifier settings found for user');
    }

    return {
      user,
      verifierSettings,
    };
  } catch (err) {
    console.error('Failed to load settings:', err);
    throw error(500, 'Failed to load settings');
  }
};
