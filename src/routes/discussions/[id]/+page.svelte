<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { pb, currentUser } from '$lib/pocketbase';
	import { marked } from 'marked';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import {
		subscribeToThread,
		unsubscribeFromThread,
		updateThreadAfterReply,
		notifyThreadSubscribers,
		notifyMentionedUsers,
	} from '$lib/utils/discussions';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let thread = $derived(data.thread);
	let replies = $derived(data.replies);
	let userIsSubscribed = $state(data.userIsSubscribed);

	let replyContent = $state('');
	let isSubmitting = $state(false);
	let error = $state('');

	// Configure marked for safe rendering
	marked.setOptions({
		breaks: true,
		gfm: true,
	});

	// Format date for display
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) {
			const hours = Math.floor(diff / (1000 * 60 * 60));
			if (hours === 0) {
				const minutes = Math.floor(diff / (1000 * 60));
				return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
			}
			return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
		} else if (days === 1) {
			return 'Yesterday';
		} else if (days < 7) {
			return `${days} days ago`;
		} else {
			return date.toLocaleDateString('en-NZ', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		}
	}

	async function handleSubscribe() {
		if (!$currentUser) {
			goto('/login');
			return;
		}

		try {
			if (userIsSubscribed) {
				await unsubscribeFromThread($currentUser.id, thread.id);
				userIsSubscribed = false;
			} else {
				await subscribeToThread($currentUser.id, thread.id);
				userIsSubscribed = true;
			}
		} catch (err) {
			console.error('Failed to toggle subscription:', err);
			error = 'Failed to update subscription. Please try again.';
		}
	}

	async function handleSubmitReply(e: Event) {
		e.preventDefault();

		if (!$currentUser) {
			goto('/login');
			return;
		}

		if (!replyContent.trim()) {
			error = 'Reply cannot be empty';
			return;
		}

		if (thread.locked) {
			error = 'This thread is locked and cannot receive new replies';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			// Create reply
			await pb.collection('discussion_replies').create({
				thread: thread.id,
				content: replyContent,
				author: $currentUser.id,
			});

			// Update thread metadata
			await updateThreadAfterReply(thread.id);

			// Auto-subscribe user if not already subscribed
			if (!userIsSubscribed) {
				await subscribeToThread($currentUser.id, thread.id);
				userIsSubscribed = true;
			}

			// Send notifications to subscribers
			const replyPreview = replyContent.replace(/[#*`_\[\]]/g, '').trim();
			await notifyThreadSubscribers(
				thread.id,
				thread.title,
				$currentUser.id,
				$currentUser.display_name,
				replyPreview
			);

			// Send mention notifications
			await notifyMentionedUsers(
				replyContent,
				thread.id,
				thread.title,
				$currentUser.id,
				$currentUser.display_name
			);

			// Clear form and reload data
			replyContent = '';
			await invalidate('app:discussion');
		} catch (err) {
			console.error('Failed to submit reply:', err);
			error = 'Failed to post reply. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{thread.title} - Discussion - Meeple Cart</title>
	<meta name="description" content={thread.content.substring(0, 160)} />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Breadcrumb -->
	<div class="mb-6 text-sm text-secondary">
		<a href="/discussions" class="hover:text-primary">Discussions</a>
		<span class="mx-2">/</span>
		<span class="text-primary">{thread.title}</span>
	</div>

	<!-- Thread Header -->
	<div class="mb-8 rounded-lg border border-subtle bg-surface-card p-6">
		<div class="mb-4 flex items-start justify-between gap-4">
			<div class="flex-1">
				<div class="mb-2 flex items-center gap-3">
					<h1 class="text-3xl font-bold text-primary">{thread.title}</h1>
					{#if thread.pinned}
						<span
							class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200"
						>
							📌 Pinned
						</span>
					{/if}
					{#if thread.locked}
						<span
							class="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200"
						>
							🔒 Locked
						</span>
					{/if}
				</div>

				<div class="flex items-center gap-4 text-sm text-secondary">
					<div class="flex items-center gap-2">
						<span class="font-medium text-primary">
							{thread.expand?.author?.display_name ?? 'Unknown'}
						</span>
						<span>·</span>
						<span>{formatDate(thread.created)}</span>
					</div>
					<span>·</span>
					<span>👁️ {thread.view_count} views</span>
					<span>·</span>
					<span>💬 {thread.reply_count} replies</span>
				</div>
			</div>

			<!-- Subscribe button -->
			<button
				onclick={handleSubscribe}
				class="btn-sm rounded-lg border px-4 py-2 text-sm font-medium transition {userIsSubscribed
					? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
					: 'border-subtle bg-surface-body text-secondary hover:border-accent hover:text-primary'}"
			>
				{userIsSubscribed ? '🔔 Subscribed' : '🔕 Subscribe'}
			</button>
		</div>

		<!-- Related listing -->
		{#if thread.listing && thread.expand?.listing}
			<div class="mb-4 rounded border border-subtle bg-surface-body p-3">
				<div class="text-xs font-medium uppercase tracking-wider text-muted">Related Listing</div>
				<a
					href="/listings/{thread.listing}"
					class="mt-1 block font-medium text-accent hover:underline"
				>
					{thread.expand.listing.title}
				</a>
			</div>
		{/if}

		<!-- Thread content -->
		<div class="prose prose-invert max-w-none">
			{@html marked.parse(thread.content)}
		</div>
	</div>

	<!-- Replies Section -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-bold text-primary">
			Replies ({thread.reply_count})
		</h2>

		{#if replies.length === 0}
			<div class="rounded-lg border border-subtle bg-surface-card p-8 text-center">
				<p class="text-secondary">No replies yet. Be the first to reply!</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each replies as reply (reply.id)}
					<div class="rounded-lg border border-subtle bg-surface-card p-6">
						<div class="mb-3 flex items-center justify-between">
							<div class="flex items-center gap-2 text-sm">
								<span class="font-medium text-primary">
									{reply.expand?.author?.display_name ?? 'Unknown'}
								</span>
								<span class="text-muted">·</span>
								<span class="text-secondary">{formatDate(reply.created)}</span>
							</div>
						</div>

						<div class="prose prose-invert max-w-none prose-p:my-2">
							{@html marked.parse(reply.content)}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Reply Form -->
	{#if $currentUser}
		{#if thread.locked}
			<div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center">
				<p class="text-amber-200">🔒 This thread is locked and cannot receive new replies.</p>
			</div>
		{:else}
			<div class="rounded-lg border border-subtle bg-surface-card p-6">
				<h3 class="mb-4 text-lg font-semibold text-primary">Post a Reply</h3>

				{#if error}
					<div class="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
						{error}
					</div>
				{/if}

				<form onsubmit={handleSubmitReply}>
					<MarkdownEditor bind:value={replyContent} placeholder="Write your reply in markdown..." />

					<div class="mt-4 flex items-center justify-between">
						<p class="text-xs text-muted">
							Tip: You can @mention other users to notify them
						</p>
						<button
							type="submit"
							disabled={isSubmitting || !replyContent.trim()}
							class="rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSubmitting ? 'Posting...' : 'Post Reply'}
						</button>
					</div>
				</form>
			</div>
		{/if}
	{:else}
		<div class="rounded-lg border border-subtle bg-surface-card p-6 text-center">
			<p class="mb-4 text-secondary">Sign in to reply to this discussion</p>
			<a
				href="/login?redirect={$page.url.pathname}"
				class="inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
			>
				Sign In
			</a>
		</div>
	{/if}
</div>
