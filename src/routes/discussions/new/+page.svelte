<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb, currentUser } from '$lib/pocketbase';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import { subscribeToThread } from '$lib/utils/discussions';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let listing = $derived(data.listing);

	let title = $state('');
	let content = $state('');
	let isSubmitting = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!$currentUser) {
			goto('/login');
			return;
		}

		if (!title.trim()) {
			error = 'Title is required';
			return;
		}

		if (title.trim().length < 3) {
			error = 'Title must be at least 3 characters';
			return;
		}

		if (title.trim().length > 200) {
			error = 'Title must be less than 200 characters';
			return;
		}

		if (!content.trim()) {
			error = 'Content is required';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			// Create thread
			const thread = await pb.collection('discussion_threads').create({
				title: title.trim(),
				content: content,
				author: $currentUser.id,
				listing: listing?.id || null,
				pinned: false,
				locked: false,
				view_count: 0,
				reply_count: 0,
			});

			// Auto-subscribe author
			await subscribeToThread($currentUser.id, thread.id);

			// If linked to listing, notify listing owner
			if (listing && listing.owner !== $currentUser.id) {
				await pb.collection('notifications').create({
					user: listing.owner,
					type: 'discussion_reply',
					title: 'New discussion on your listing',
					message: `${$currentUser.display_name} started a discussion: "${title.trim()}"`,
					link: `/discussions/${thread.id}`,
					read: false,
				});

				// Auto-subscribe listing owner
				await subscribeToThread(listing.owner, thread.id);
			}

			// Redirect to thread
			goto(`/discussions/${thread.id}`);
		} catch (err) {
			console.error('Failed to create thread:', err);
			error = 'Failed to create discussion. Please try again.';
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>New Discussion - Meeple Cart</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<!-- Breadcrumb -->
	<div class="mb-6 text-sm text-secondary">
		<a href="/discussions" class="hover:text-primary">Discussions</a>
		<span class="mx-2">/</span>
		<span class="text-primary">New Discussion</span>
	</div>

	<!-- Header -->
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-primary">Start a Discussion</h1>
		<p class="text-secondary">
			{#if listing}
				About: <a href="/listings/{listing.id}" class="font-medium text-accent hover:underline">
					{listing.title}
				</a>
			{:else}
				Share your thoughts, ask questions, or start a conversation with the community.
			{/if}
		</p>
	</div>

	<!-- Related listing info -->
	{#if listing}
		<div class="mb-6 rounded-lg border border-subtle bg-surface-card p-4">
			<div class="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
				Related Listing
			</div>
			<div class="flex items-start gap-4">
				{#if listing.photos && listing.photos.length > 0}
					<img
						src={pb.files.getUrl(listing, listing.photos[0], { thumb: '100x100' })}
						alt={listing.title}
						class="h-16 w-16 rounded object-cover"
					/>
				{/if}
				<div class="flex-1">
					<a
						href="/listings/{listing.id}"
						class="font-semibold text-primary hover:text-accent hover:underline"
					>
						{listing.title}
					</a>
					<p class="text-sm text-secondary">
						by {listing.expand?.owner?.display_name ?? 'Unknown'}
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Form -->
	<div class="rounded-lg border border-subtle bg-surface-card p-6">
		{#if error}
			<div class="alert alert-error mb-4">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Title -->
			<div>
				<label for="title" class="mb-2 block text-sm font-medium text-secondary">
					Title <span class="text-red-400">*</span>
				</label>
				<input
					type="text"
					id="title"
					bind:value={title}
					placeholder="What's this discussion about?"
					maxlength="200"
					class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none"
					required
				/>
				<div class="mt-1 text-right text-xs text-muted">
					{title.length}/200
				</div>
			</div>

			<!-- Content -->
			<div>
				<label for="content" class="mb-2 block text-sm font-medium text-secondary">
					Content <span class="text-red-400">*</span>
				</label>
				<MarkdownEditor
					bind:value={content}
					placeholder="Write your message in markdown..."
					rows={10}
				/>
				<p class="mt-2 text-xs text-muted">
					You can use markdown for formatting. @mention users to notify them.
				</p>
			</div>

			<!-- Actions -->
			<div class="flex items-center justify-between gap-4">
				<a
					href={listing ? `/listings/${listing.id}` : '/discussions'}
					class="text-sm text-secondary hover:text-primary"
				>
					Cancel
				</a>
				<button
					type="submit"
					disabled={isSubmitting || !title.trim() || !content.trim()}
					class="rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSubmitting ? 'Creating...' : 'Create Discussion'}
				</button>
			</div>
		</form>
	</div>

	<!-- Guidelines -->
	<div class="mt-6 rounded-lg border border-subtle bg-surface-body p-4">
		<h3 class="mb-2 text-sm font-semibold text-primary">Community Guidelines</h3>
		<ul class="space-y-1 text-xs text-secondary">
			<li>• Be respectful and constructive</li>
			<li>• Stay on topic and relevant to board game trading</li>
			<li>• No spam, self-promotion, or duplicate posts</li>
			<li>• Report any inappropriate content to moderators</li>
		</ul>
		<a
			href="/guidelines"
			class="mt-3 inline-block text-xs text-accent hover:underline"
		>
			Read full community guidelines →
		</a>
	</div>
</div>
