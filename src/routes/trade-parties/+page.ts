import { pb } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    try {
        const parties = await pb.collection('trade_parties').getFullList({
            sort: '-created',
            expand: 'organizer',
        });

        return {
            parties,
        };
    } catch (err) {
        console.error('Failed to load trade parties:', err);
        return {
            parties: [],
        };
    }
};
