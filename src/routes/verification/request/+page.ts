import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';
import { get } from 'svelte/store';
import { currentUser } from '$lib/pocketbase';
import type { VerificationRequestRecord } from '$lib/types/pocketbase';

export const load: PageLoad = async () => {
  // Check if user is authenticated
  const user = get(currentUser);

  if (!user) {
    throw redirect(302, '/login?redirect=/verification/request');
  }

  try {
    // Check if user already has a pending verification request
    let existingRequest: VerificationRequestRecord | null = null;

    try {
      existingRequest = await pb
        .collection('verification_requests')
        .getFirstListItem<VerificationRequestRecord>(
          `user = "${user.id}" && (status = "pending" || status = "assigned" || status = "sent")`
        );
    } catch (err) {
      // No pending request - that's okay
    }

    // Get current queue length
    const pendingRequests = await pb
      .collection('verification_requests')
      .getList(1, 1, {
        filter: 'status = "pending"',
      });

    return {
      user,
      existingRequest,
      hasPendingRequest: !!existingRequest,
      queueLength: pendingRequests.totalItems,
    };
  } catch (err) {
    console.error('Failed to load verification request page:', err);
    throw error(500, 'Failed to load verification request page');
  }
};
