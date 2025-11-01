import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';
import type { VerificationLinkRecord, VerifierSettingsRecord } from '$lib/types/pocketbase';

export const load: PageLoad = async ({ params }) => {
  const { code } = params;

  try {
    // Find verification link by code
    let link: VerificationLinkRecord | null = null;
    let verifierSettings: VerifierSettingsRecord | null = null;

    try {
      link = await pb
        .collection('verification_links')
        .getFirstListItem<VerificationLinkRecord>(`code = "${code}"`);

      // Get verifier settings
      if (link.verifier) {
        try {
          verifierSettings = await pb
            .collection('verifier_settings')
            .getFirstListItem<VerifierSettingsRecord>(`user = "${link.verifier}"`);
        } catch (err) {
          console.log('No verifier settings found');
        }
      }
    } catch (err) {
      // Link not found - return null
      console.error('Verification link not found:', code);
    }

    return {
      code,
      link,
      verifierSettings,
    };
  } catch (err) {
    console.error('Failed to load verification link:', err);
    return {
      code,
      link: null,
      verifierSettings: null,
    };
  }
};
