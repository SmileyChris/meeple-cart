<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import {
    hashPhoneNumber,
    getPhoneLastFour,
    isValidNZPhoneNumber,
    formatPhoneNumber,
    estimateWaitTime,
    canRequestVerification,
  } from '$lib/utils/trust-buddy';

  let { data }: { data: PageData } = $props();

  let user = $derived($currentUser);
  let phoneNumber = $state(user?.phone || '');
  let submitting = $state(false);
  let error = $state<string | null>(null);

  // Check eligibility
  let canRequest = $derived(
    canRequestVerification(user?.phone_verified || false, data.hasPendingRequest, phoneNumber)
  );

  let step = $state<'input' | 'confirm' | 'submitted'>('input');

  async function handleNext() {
    error = null;

    // Validate phone number
    if (!isValidNZPhoneNumber(phoneNumber)) {
      error = 'Please enter a valid NZ phone number';
      return;
    }

    step = 'confirm';
  }

  function handleBack() {
    step = 'input';
  }

  async function handleSubmit() {
    if (!user) return;

    submitting = true;
    error = null;

    try {
      // Hash phone number for security
      const phone_hash = await hashPhoneNumber(phoneNumber);
      const phone_last_four = getPhoneLastFour(phoneNumber);

      // Update user's phone number if it changed
      if (user.phone !== phoneNumber) {
        await pb.collection('users').update(user.id, {
          phone: phoneNumber,
          phone_hash: phone_hash,
        });
      }

      // Create verification request
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const request = await pb.collection('verification_requests').create({
        user: user.id,
        phone_hash: phone_hash,
        phone_last_four: phone_last_four,
        status: 'pending',
        queue_position: data.queueLength + 1,
        expires_at: expiresAt.toISOString(),
      });

      step = 'submitted';

      // Refresh page data after a moment to show queue position
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit verification request:', err);
      error = err.message || 'Failed to submit verification request';
      step = 'confirm';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Request Phone Verification · Meeple Cart</title>
  <meta name="description" content="Request phone verification from the Meeple Cart community" />
</svelte:head>

<main class="bg-surface-body px-6 py-12">
  <div class="mx-auto max-w-2xl">
    {#if user?.phone_verified}
      <!-- Already Verified -->
      <div class="text-center">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/80 bg-emerald-500/10"
        >
          <span class="text-4xl">✅</span>
        </div>
        <h1 class="mt-6 text-3xl font-bold text-primary">Already Verified</h1>
        <p class="mt-2 text-muted">Your phone number is already verified</p>
        <div class="mt-8">
          <a
            href="/settings"
            class="inline-block rounded-md bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
          >
            Go to Settings
          </a>
        </div>
      </div>
    {:else if data.existingRequest}
      <!-- Pending Request -->
      <div class="rounded-xl border border-subtle bg-surface-card p-8">
        <div class="text-center">
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-sky-500/80 bg-sky-500/10"
          >
            <span class="text-4xl">⏳</span>
          </div>
          <h1 class="mt-6 text-3xl font-bold text-primary">Verification Pending</h1>
          <p class="mt-2 text-muted">Your verification request is in the queue</p>
        </div>

        <div class="mt-8 space-y-4">
          <!-- Queue Position -->
          <div class="rounded-lg border border-subtle bg-surface-body p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted">Queue Position</span>
              <span class="text-2xl font-bold text-accent">
                #{data.existingRequest.queue_position}
              </span>
            </div>
          </div>

          <!-- Estimated Wait -->
          <div class="rounded-lg border border-subtle bg-surface-body p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted">Estimated Wait</span>
              <span class="text-lg font-semibold text-primary">
                {estimateWaitTime(data.existingRequest.queue_position || 0)}
              </span>
            </div>
          </div>

          <!-- Status -->
          <div class="rounded-lg border border-subtle bg-surface-body p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted">Status</span>
              <span
                class="rounded-full border border-sky-500/80 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-200"
              >
                {data.existingRequest.status}
              </span>
            </div>
          </div>

          <!-- Instructions -->
          <div class="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <p class="text-sm text-secondary">
              <strong>What happens next:</strong><br />
              A verified community member will send you a verification link via SMS to your phone number
              ending in {data.existingRequest.phone_last_four}. Click the link when you receive it
              to complete verification.
            </p>
          </div>
        </div>
      </div>
    {:else if step === 'input'}
      <!-- Step 1: Phone Input -->
      <div class="rounded-xl border border-subtle bg-surface-card p-8">
        <h1 class="text-3xl font-bold text-primary">Request Phone Verification</h1>
        <p class="mt-2 text-muted">
          Get verified by a trusted community member to unlock vouching privileges
        </p>

        <form
          onsubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
          class="mt-8 space-y-6"
        >
          <!-- Phone Number Input -->
          <div>
            <label for="phone" class="block text-sm font-medium text-secondary">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              bind:value={phoneNumber}
              placeholder="021-234-5678"
              required
              class="mt-1 block w-full rounded-md border border-subtle bg-surface-body px-4 py-3 text-primary placeholder-muted"
            />
            <p class="mt-1 text-xs text-muted">Enter your NZ mobile or landline number</p>
          </div>

          <!-- How It Works -->
          <div class="rounded-lg border border-subtle bg-surface-body p-4">
            <h3 class="font-semibold text-primary">How it works</h3>
            <ol class="mt-2 space-y-2 text-sm text-muted">
              <li class="flex gap-2">
                <span class="font-bold text-accent">1.</span>
                Enter your phone number and submit request
              </li>
              <li class="flex gap-2">
                <span class="font-bold text-accent">2.</span>
                Join the verification queue
              </li>
              <li class="flex gap-2">
                <span class="font-bold text-accent">3.</span>
                A verified member sends you a link via SMS
              </li>
              <li class="flex gap-2">
                <span class="font-bold text-accent">4.</span>
                Click the link to complete verification
              </li>
            </ol>
          </div>

          <!-- Current Queue Length -->
          {#if data.queueLength > 0}
            <div class="rounded-lg border border-subtle bg-surface-body p-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted">People in queue</span>
                <span class="text-xl font-bold text-accent">{data.queueLength}</span>
              </div>
              <p class="mt-1 text-xs text-muted">
                Est. wait time: {estimateWaitTime(data.queueLength + 1)}
              </p>
            </div>
          {/if}

          {#if error}
            <div
              class="rounded-md border border-rose-500/80 bg-rose-500/10 px-4 py-3 text-rose-200"
            >
              {error}
            </div>
          {/if}

          <button
            type="submit"
            disabled={!canRequest}
            class="w-full rounded-md bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </form>
      </div>
    {:else if step === 'confirm'}
      <!-- Step 2: Confirmation -->
      <div class="rounded-xl border border-subtle bg-surface-card p-8">
        <h1 class="text-3xl font-bold text-primary">Confirm Your Request</h1>
        <p class="mt-2 text-muted">Please review your information before submitting</p>

        <div class="mt-8 space-y-4">
          <!-- Phone Number -->
          <div class="rounded-lg border border-subtle bg-surface-body p-4">
            <div class="text-sm text-muted">Phone Number</div>
            <div class="mt-1 text-lg font-semibold text-primary">
              {formatPhoneNumber(phoneNumber)}
            </div>
          </div>

          <!-- Important Notes -->
          <div class="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <h3 class="font-semibold text-amber-200">Important</h3>
            <ul class="mt-2 space-y-1 text-sm text-amber-200/80">
              <li>• Make sure this phone number is correct</li>
              <li>• You'll receive an SMS from a community member</li>
              <li>• The verification link expires in 24 hours</li>
              <li>• You can only request verification once every 7 days</li>
            </ul>
          </div>

          {#if error}
            <div
              class="rounded-md border border-rose-500/80 bg-rose-500/10 px-4 py-3 text-rose-200"
            >
              {error}
            </div>
          {/if}

          <div class="flex gap-3">
            <button
              type="button"
              onclick={handleBack}
              disabled={submitting}
              class="flex-1 rounded-md border border-subtle bg-surface-body px-4 py-3 font-medium text-secondary transition-colors hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onclick={handleSubmit}
              disabled={submitting}
              class="flex-1 rounded-md bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    {:else if step === 'submitted'}
      <!-- Step 3: Success -->
      <div class="text-center">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/80 bg-emerald-500/10"
        >
          <span class="text-4xl">🎉</span>
        </div>
        <h1 class="mt-6 text-3xl font-bold text-primary">Request Submitted!</h1>
        <p class="mt-2 text-muted">You're in the verification queue</p>

        <div class="mt-8">
          <p class="text-secondary">
            A community member will send you a verification link via SMS soon. Watch for a text
            message!
          </p>
        </div>
      </div>
    {/if}
  </div>
</main>
