<script lang="ts">
	import { currentUser } from '$lib/pocketbase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let threads = $derived(data.threads);

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
				return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
			}
			return hours === 1 ? '1h ago' : `${hours}h ago`;
		} else if (days === 1) {
			return 'Yesterday';
		} else if (days < 7) {
			return `${days}d ago`;
		} else {
			return date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' });
		}
	}

	// Get preview text from markdown content
	function getPreview(content: string, maxLength: number = 200): string {
		// Strip markdown syntax
		const plain = content
			.replace(/[#*`_\[\]]/g, '')
			.replace(/\n+/g, ' ')
			.trim();
		return plain.length > maxLength ? plain.substring(0, maxLength) + '...' : plain;
	}
</script>

<svelte:head>
	<title>Discussions · Meeple Cart</title>
	<meta
		name="description"
		content="Connect with the board gaming community in New Zealand. Discuss games, trading tips, and more."
	/>
</svelte:head>

<main class="bg-surface-body px-6 py-16 text-primary transition-colors sm:px-8">
	<div class="mx-auto max-w-4xl space-y-8">
		<!-- Header -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">💬 Discussions</h1>
					<p class="mt-2 text-base text-secondary sm:text-lg">
						Connect with the board gaming community across Aotearoa
					</p>
				</div>
				{#if $currentUser}
					<a
						href="/discussions/new"
						class="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
					>
						New Discussion
					</a>
				{/if}
			</div>
		</div>

		<!-- Thread List -->
		{#if threads.length === 0}
			<div class="rounded-xl border border-subtle bg-surface-card p-12 text-center">
				<p class="text-lg text-secondary">No discussions yet</p>
				<p class="mt-2 text-sm text-muted">
					Be the first to start a discussion!
				</p>
				{#if $currentUser}
					<a
						href="/discussions/new"
						class="mt-4 inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
					>
						Start a Discussion
					</a>
				{:else}
					<a
						href="/login?redirect=/discussions"
						class="mt-4 inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
					>
						Sign In to Start
					</a>
				{/if}
			</div>
		{:else}
			<div class="space-y-3">
				{#each threads as thread (thread.id)}
					<a
						href="/discussions/{thread.id}"
						class="block rounded-lg border border-subtle bg-surface-card p-6 transition hover:border-accent"
					>
						<div class="mb-3 flex items-start justify-between gap-4">
							<div class="flex-1">
								<div class="mb-1 flex items-center gap-2">
									<h2 class="text-lg font-semibold text-primary hover:text-accent">
										{thread.title}
									</h2>
									{#if thread.pinned}
										<span
											class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-badge-emerald"
										>
											📌 Pinned
										</span>
									{/if}
									{#if thread.locked}
										<span
											class="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-badge-amber"
										>
											🔒 Locked
										</span>
									{/if}
								</div>

								<p class="text-sm text-secondary">
									{getPreview(thread.content)}
								</p>
							</div>
						</div>

						<div class="flex items-center gap-4 text-xs text-muted">
							<span class="font-medium text-secondary">
								{thread.expand?.author?.display_name ?? 'Unknown'}
							</span>
							<span>·</span>
							<span>{formatDate(thread.created)}</span>
							<span>·</span>
							<span>👁️ {thread.view_count}</span>
							<span>·</span>
							<span>💬 {thread.reply_count}</span>
							{#if thread.last_reply_at}
								<span>·</span>
								<span>Last reply {formatDate(thread.last_reply_at)}</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Sign in prompt for guests -->
		{#if !$currentUser}
			<div class="rounded-lg border border-subtle bg-surface-card p-6 text-center">
				<p class="mb-4 text-secondary">Sign in to start discussions and reply to threads</p>
				<a
					href="/login?redirect=/discussions"
					class="inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
				>
					Sign In
				</a>
			</div>
		{/if}
	</div>
</main>
