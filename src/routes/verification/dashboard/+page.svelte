<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { invalidate } from '$app/navigation';
  import {
    generateVerificationCode,
    generateSMSTemplate,
    maskPhoneNumber,
    estimateWaitTime,
    getVerificationExpiry,
    formatKarma,
    getVerifierBadge,
  } from '$lib/utils/trust-buddy';
  import type { VerificationRequestRecord } from '$lib/types/pocketbase';

  let { data }: { data: PageData } = $props();

  let user = $derived($currentUser);
  let pendingRequests = $state(data.pendingRequests);
  let verifierSettings = $state(data.verifierSettings);

  let selectedRequest = $state<VerificationRequestRecord | null>(null);
  let generatedLink = $state<string | null>(null);
  let smsTemplate = $state<string>('');
  let processing = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  // Verifier badge
  let badge = $derived(
    verifierSettings ? getVerifierBadge(verifierSettings.total_verifications) : null,
  );

  async function acceptRequest(request: VerificationRequestRecord) {
    if (!user) return;

    processing = true;
    error = null;
    success = null;

    try {
      // Generate unique verification code
      const code = generateVerificationCode();

      // Create verification link
      const expiresAt = getVerificationExpiry();

      const link = await pb.collection('verification_links').create({
        code: code,
        request: request.id,
        verifier: user.id,
        target_phone_hash: request.phone_hash,
        attempt_count: 0,
        used: false,
        expires_at: expiresAt.toISOString(),
      });

      // Update request status
      await pb.collection('verification_requests').update(request.id, {
        status: 'assigned',
        assigned_at: new Date().toISOString(),
      });

      // Generate SMS template
      const template = generateSMSTemplate(user.display_name, code);

      // Set state for modal
      selectedRequest = request;
      generatedLink = `https://meeple.cart.nz/trust-${code}`;
      smsTemplate = template;

      success = 'Verification link generated!';
    } catch (err: any) {
      console.error('Failed to accept request:', err);
      error = err.message || 'Failed to generate verification link';
    } finally {
      processing = false;
    }
  }

  async function markAsSent() {
    if (!selectedRequest || !user) return;

    processing = true;
    error = null;

    try {
      // Update request status to "sent"
      await pb.collection('verification_requests').update(selectedRequest.id, {
        status: 'sent',
      });

      // Update verifier stats
      if (verifierSettings) {
        await pb.collection('verifier_settings').update(verifierSettings.id, {
          total_verifications: verifierSettings.total_verifications + 1,
          last_verification: new Date().toISOString(),
          karma_earned: verifierSettings.karma_earned + 10, // Award 10 karma for sending
        });
      }

      success = 'Marked as sent! Thanks for helping verify a community member.';

      // Refresh data
      await invalidate('verification:dashboard');

      // Close modal after 2 seconds
      setTimeout(() => {
        selectedRequest = null;
        generatedLink = null;
        smsTemplate = '';
        success = null;
      }, 2000);
    } catch (err: any) {
      console.error('Failed to mark as sent:', err);
      error = err.message || 'Failed to update verification status';
    } finally {
      processing = false;
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    success = 'Copied to clipboard!';
    setTimeout(() => {
      if (success === 'Copied to clipboard!') success = null;
    }, 2000);
  }

  function closeModal() {
    selectedRequest = null;
    generatedLink = null;
    smsTemplate = '';
  }
</script>

<svelte:head>
  <title>Verifier Dashboard · Meeple Cart</title>
  <meta name="description" content="Help verify new members and earn karma" />
</svelte:head>

<main class="min-h-screen bg-surface-body px-6 py-12">
  <div class="mx-auto max-w-5xl space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-primary">Verifier Dashboard</h1>
      <p class="mt-2 text-muted">Help new members get verified and earn karma</p>
    </div>

    <!-- Verifier Stats -->
    {#if verifierSettings}
      <div class="rounded-xl border border-subtle bg-surface-card p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-primary">Your Stats</h2>
            {#if badge}
              <div class="mt-2 flex items-center gap-2">
                <span class="text-2xl">{badge.icon}</span>
                <span class="text-sm font-medium {badge.color}">{badge.name}</span>
              </div>
            {/if}
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold text-accent">
              {formatKarma(verifierSettings.karma_earned)}
            </div>
            <div class="text-sm text-muted">Karma</div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-emerald-300">
              {verifierSettings.total_verifications}
            </div>
            <div class="text-sm text-muted">Total Sent</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-emerald-300">
              {verifierSettings.success_count}
            </div>
            <div class="text-sm text-muted">Completed</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-emerald-300">
              {verifierSettings.total_verifications > 0
                ? Math.round((verifierSettings.success_count / verifierSettings.total_verifications) * 100)
                : 0}%
            </div>
            <div class="text-sm text-muted">Success Rate</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Pending Requests -->
    <div class="rounded-xl border border-subtle bg-surface-card p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-primary">Pending Requests</h2>
        <span class="rounded-full border border-accent bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          {pendingRequests.length} waiting
        </span>
      </div>

      <div class="mt-6 space-y-4">
        {#if pendingRequests.length === 0}
          <div class="rounded-lg border border-subtle bg-surface-body p-8 text-center">
            <span class="text-4xl">🎉</span>
            <p class="mt-2 text-muted">No pending requests right now</p>
            <p class="text-sm text-muted">Check back later to help verify more members</p>
          </div>
        {:else}
          {#each pendingRequests as request (request.id)}
            <div class="rounded-lg border border-subtle bg-surface-body p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-primary">
                      {request.expand?.user?.display_name || 'User'}
                    </span>
                    {#if request.queue_position}
                      <span class="rounded-full border border-subtle bg-surface-card px-2 py-0.5 text-xs text-muted">
                        #{request.queue_position} in queue
                      </span>
                    {/if}
                  </div>

                  <div class="mt-2 flex items-center gap-4 text-sm text-muted">
                    <span>Phone: XXX-XXX-{request.phone_last_four}</span>
                    <span>•</span>
                    <span>
                      Requested: {new Intl.DateTimeFormat('en-NZ', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(request.created))}
                    </span>
                  </div>

                  {#if request.expand?.user}
                    <div class="mt-2 flex items-center gap-4 text-sm text-muted">
                      <span>Trades: {request.expand.user.trade_count}</span>
                      <span>•</span>
                      <span>Vouches: {request.expand.user.vouch_count}</span>
                    </div>
                  {/if}
                </div>

                <button
                  type="button"
                  onclick={() => acceptRequest(request)}
                  disabled={processing}
                  class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Accept
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if success && !selectedRequest}
      <div class="rounded-md border border-emerald-500/80 bg-emerald-500/10 px-4 py-3 text-emerald-200">
        {success}
      </div>
    {/if}

    {#if error}
      <div class="rounded-md border border-rose-500/80 bg-rose-500/10 px-4 py-3 text-rose-200">
        {error}
      </div>
    {/if}
  </div>
</main>

<!-- Verification Link Modal -->
{#if selectedRequest && generatedLink}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    onclick={closeModal}
  >
    <div
      class="w-full max-w-2xl rounded-xl border border-subtle bg-surface-card p-6"
      onclick={(e) => e.stopPropagation()}
    >
      <h2 class="text-2xl font-bold text-primary">Send Verification Link</h2>
      <p class="mt-2 text-sm text-muted">
        Send this message to <strong>{selectedRequest.expand?.user?.display_name}</strong> via SMS
      </p>

      <!-- SMS Template -->
      <div class="mt-6">
        <label class="block text-sm font-medium text-secondary">SMS Message</label>
        <div class="relative mt-1">
          <textarea
            readonly
            value={smsTemplate}
            rows="3"
            class="w-full rounded-md border border-subtle bg-surface-body px-4 py-3 text-primary"
          ></textarea>
          <button
            type="button"
            onclick={() => copyToClipboard(smsTemplate)}
            class="absolute right-2 top-2 rounded-md bg-accent/10 px-3 py-1 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
          >
            Copy
          </button>
        </div>
        <p class="mt-1 text-xs text-muted">
          Send this exact message to XXX-XXX-{selectedRequest.phone_last_four}
        </p>
      </div>

      <!-- Verification Link -->
      <div class="mt-4">
        <label class="block text-sm font-medium text-secondary">Verification Link</label>
        <div class="relative mt-1">
          <input
            type="text"
            readonly
            value={generatedLink}
            class="w-full rounded-md border border-subtle bg-surface-body px-4 py-3 pr-20 text-primary"
          />
          <button
            type="button"
            onclick={() => copyToClipboard(generatedLink || '')}
            class="absolute right-2 top-2 rounded-md bg-accent/10 px-3 py-1 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
          >
            Copy
          </button>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <p class="text-sm text-secondary">
          <strong>Steps:</strong>
        </p>
        <ol class="mt-2 space-y-1 text-sm text-secondary">
          <li>1. Copy the SMS message above</li>
          <li>2. Open your phone's messaging app</li>
          <li>3. Send it to the number ending in {selectedRequest.phone_last_four}</li>
          <li>4. Click "Mark as Sent" below when done</li>
        </ol>
      </div>

      {#if success}
        <div class="mt-4 rounded-md border border-emerald-500/80 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          {success}
        </div>
      {/if}

      <!-- Actions -->
      <div class="mt-6 flex gap-3">
        <button
          type="button"
          onclick={closeModal}
          disabled={processing}
          class="flex-1 rounded-md border border-subtle bg-surface-body px-4 py-3 font-medium text-secondary transition-colors hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={markAsSent}
          disabled={processing}
          class="flex-1 rounded-md bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Mark as Sent'}
        </button>
      </div>
    </div>
  </div>
{/if}
