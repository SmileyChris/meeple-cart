import { json, error } from '@sveltejs/kit';
import { finalizeTradeMatching } from '$lib/trade-optimizer/runner';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
    const partyId = params.id;

    if (!partyId) {
        throw error(400, 'Missing party ID');
    }

    try {
        // In a real app, you would check if the User is the organizer here
        // using locals.pb.authStore.model.id or similar

        const result = await finalizeTradeMatching(partyId);
        return json(result);
    } catch (err: any) {
        console.error('API Error finalizing match:', err);
        throw error(500, err.message || 'Internal server error');
    }
};
