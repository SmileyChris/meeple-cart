<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  let user = $derived($currentUser);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let verificationSent = $state(false);

  // Auto-confirm verification if token is present
  onMount(async () => {
    if (data.token) {
      await confirmVerification(data.token);
    }
  });

  async function requestEmailVerification() {
    if (!user?.email) return;

    loading = true;
    error = null;
    success = null;

    try {
      await pb.collection('users').requestVerification(user.email);
      verificationSent = true;
      success = 'Verification email sent! Please check your inbox.';
    } catch (err: any) {
      console.error('Failed to send verification email:', err);
      error = err.message || 'Failed to send verification email. Please try again later.';
    } finally {
      loading = false;
    }
  }

  async function confirmVerification(token: string) {
    loading = true;
    error = null;
    success = null;

    try {
      await pb.collection('users').confirmVerification(token);
      success = 'Email verified successfully! Your account is now verified.';

      // Refresh user data
      if (user) {
        const updatedUser = await pb.collection('users').getOne(user.id);
        currentUser.set(updatedUser);
      }
    } catch (err: any) {
      console.error('Failed to confirm verification:', err);
      error =
        err.message || 'Failed to verify email. The verification link may be expired or invalid.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Verification · Meeple Cart</title>
  <meta name="description" content="Verify your email and phone to unlock all features" />
</svelte:head>

<main class="bg-surface-body px-6 py-12">
  <div class="mx-auto max-w-2xl space-y-6">
    <!-- Email Verification -->
    <div class="rounded-xl border border-subtle bg-surface-card p-8 shadow-elevated">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg class="h-8 w-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 class="mt-6 text-2xl font-bold text-primary">Email Verification</h1>
        <p class="mt-2 text-sm text-muted">
          Verify your email to unlock vouching and other features
        </p>
      </div>

      <!-- Current Status -->
      <div class="mt-8">
        {#if user?.verified}
          <div class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-body p-4">
            <svg
              class="h-6 w-6 text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-secondary">Email Verified</p>
              <p class="text-sm text-muted">{user.email}</p>
            </div>
          </div>
        {:else}
          <div
            class="flex items-center gap-3 rounded-lg border border-amber-500/80 bg-amber-500/10 p-4"
          >
            <svg
              class="h-6 w-6 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-amber-200">Email Not Verified</p>
              <p class="text-sm text-amber-200/80">{user?.email}</p>
            </div>
          </div>

          <!-- Verification Instructions -->
          <div class="mt-6 space-y-4 rounded-lg border border-subtle bg-surface-body p-6">
            <h2 class="font-semibold text-primary">Why verify your email?</h2>
            <ul class="space-y-2 text-sm text-muted">
              <li class="flex items-start gap-2">
                <svg
                  class="mt-0.5 h-4 w-4 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Required to vouch for other traders</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="mt-0.5 h-4 w-4 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Build trust with the community</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="mt-0.5 h-4 w-4 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Unlock all platform features</span>
              </li>
              <li class="flex items-start gap-2">
                <svg
                  class="mt-0.5 h-4 w-4 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Secure your account</span>
              </li>
            </ul>
          </div>

          <!-- Send Verification Button -->
          <div class="mt-6">
            <button
              type="button"
              onclick={requestEmailVerification}
              disabled={loading || verificationSent}
              class="w-full rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {#if loading}
                Sending...
              {:else if verificationSent}
                Verification Email Sent
              {:else}
                Send Verification Email
              {/if}
            </button>
          </div>

          {#if verificationSent}
            <div
              class="mt-4 rounded-lg border border-subtle bg-surface-body p-4 text-sm text-muted"
            >
              <p class="font-medium text-secondary">Check your inbox!</p>
              <p class="mt-1">
                We've sent a verification link to <span class="text-primary">{user?.email}</span>.
                Click the link in the email to verify your account.
              </p>
              <p class="mt-2 text-xs">
                Didn't receive it? Check your spam folder or click the button above to resend.
              </p>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Success/Error Messages -->
      {#if success}
        <div class="mt-6 rounded-lg border border-subtle bg-surface-body p-4">
          <p class="text-sm text-secondary">{success}</p>
        </div>
      {/if}

      {#if error}
        <div class="mt-6 rounded-lg border border-subtle bg-surface-body p-4">
          <p class="text-sm text-secondary">{error}</p>
        </div>
      {/if}
    </div>

    <!-- Phone Verification -->
    <div class="rounded-xl border border-subtle bg-surface-card p-8 shadow-elevated">
      <div class="text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg class="h-8 w-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>
        <h2 class="mt-6 text-2xl font-bold text-primary">Phone Verification</h2>
        <p class="mt-2 text-sm text-muted">
          Verify your phone number through a trusted community member
        </p>
      </div>

      <div class="mt-8">
        {#if user?.phone_verified}
          <div class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-body p-4">
            <svg
              class="h-6 w-6 text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-secondary">Phone Verified</p>
              <p class="text-sm text-muted">Your phone number has been verified</p>
            </div>
          </div>
        {:else}
          <div class="space-y-6">
            <div
              class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-body p-4"
            >
              <svg class="h-6 w-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div class="flex-1">
                <p class="font-medium text-secondary">Phone Not Verified</p>
                <p class="text-sm text-muted">Add and verify your phone number in settings</p>
              </div>
            </div>

            <div class="rounded-lg border border-subtle bg-surface-body p-6">
              <h3 class="font-semibold text-primary">How phone verification works:</h3>
              <ol class="mt-4 space-y-3 text-sm text-muted">
                <li class="flex gap-3">
                  <span class="font-semibold text-secondary">1.</span>
                  <span>Add your phone number in Settings</span>
                </li>
                <li class="flex gap-3">
                  <span class="font-semibold text-secondary">2.</span>
                  <span>Request verification from a trusted community member</span>
                </li>
                <li class="flex gap-3">
                  <span class="font-semibold text-secondary">3.</span>
                  <span>They'll send you a verification link via SMS</span>
                </li>
                <li class="flex gap-3">
                  <span class="font-semibold text-secondary">4.</span>
                  <span>Click the link to verify your phone number</span>
                </li>
              </ol>
            </div>

            <a
              href="/settings"
              class="block w-full rounded-lg bg-accent px-6 py-3 text-center font-medium text-white transition-colors hover:bg-accent/90"
            >
              Go to Settings
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</main>
