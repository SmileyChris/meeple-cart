import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';
import { get } from 'svelte/store';
import { currentUser } from '$lib/pocketbase';
import type { VerificationRequestRecord, VerifierSettingsRecord } from '$lib/types/pocketbase';

export const load: PageLoad = async () => {
  // Check if user is authenticated
  const user = get(currentUser);

  if (!user) {
    throw redirect(302, '/login?redirect=/verification/dashboard');
  }

  // Check if user is phone verified
  if (!user.phone_verified) {
    throw redirect(302, '/settings?error=phone_not_verified');
  }

  try {
    // Get verifier settings
    let verifierSettings: VerifierSettingsRecord | null = null;

    try {
      verifierSettings = await pb
        .collection('verifier_settings')
        .getFirstListItem<VerifierSettingsRecord>(`user = "${user.id}"`);

      // Check if verifier is active
      if (!verifierSettings?.is_active) {
        throw redirect(302, '/settings?error=verifier_not_active');
      }
    } catch (err) {
      // No verifier settings - redirect to settings
      throw redirect(302, '/settings?error=not_a_verifier');
    }

    // Get pending verification requests
    const pendingRequests = await pb
      .collection('verification_requests')
      .getList<VerificationRequestRecord>(1, 50, {
        filter: 'status = "pending"',
        sort: 'queue_position',
        expand: 'user',
      });

    return {
      user,
      verifierSettings,
      pendingRequests: pendingRequests.items,
    };
  } catch (err) {
    // If it's a redirect, rethrow it
    if (err instanceof Response) {
      throw err;
    }

    console.error('Failed to load verifier dashboard:', err);
    throw error(500, 'Failed to load verifier dashboard');
  }
};
