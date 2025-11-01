import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';
import type { DiscussionThreadRecord, DiscussionReplyRecord } from '$lib/types/pocketbase';
import { isSubscribed } from '$lib/utils/discussions';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const { id } = params;
	const user = get(currentUser);

	try {
		// Fetch thread with author and listing relations
		const thread = await pb
			.collection('discussion_threads')
			.getOne<DiscussionThreadRecord>(id, {
				expand: 'author,listing,listing.owner',
			});

		// Fetch all replies for this thread
		const replies = await pb
			.collection('discussion_replies')
			.getList<DiscussionReplyRecord>(1, 200, {
				filter: `thread = "${id}"`,
				sort: 'created',
				expand: 'author',
			});

		// Check if current user is subscribed
		let userIsSubscribed = false;
		if (user) {
			userIsSubscribed = await isSubscribed(user.id, id);
		}

		// Increment view count (fire and forget, don't await)
		pb.collection('discussion_threads')
			.update(id, {
				view_count: thread.view_count + 1,
			})
			.catch((err) => console.error('Failed to increment view count:', err));

		return {
			thread,
			replies: replies.items,
			userIsSubscribed,
		};
	} catch (err: any) {
		console.error('Failed to load discussion thread:', err);
		throw error(err.status || 500, err.message || 'Failed to load discussion');
	}
};
