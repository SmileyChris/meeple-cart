<script lang="ts">
  /**
   * VerificationWarning Component
   *
   * Displays a warning banner on user's own profile if they haven't verified their email.
   * Email verification unlocks vouching privileges and builds trust.
   */

  interface Props {
    /** Whether the user's email is verified */
    emailVerified: boolean;
    /** Custom class names */
    class?: string;
  }

  let { emailVerified, class: className = '' }: Props = $props();

  // Component is only rendered if email is not verified
  let showWarning = $derived(!emailVerified);
</script>

{#if showWarning}
  <div
    class="rounded-lg border border-amber-500/80 bg-amber-500/10 p-4 {className}"
    role="alert"
    aria-live="polite"
  >
    <div class="flex items-start gap-3">
      <span class="text-2xl" aria-hidden="true">⚠️</span>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-amber-200">Verify your email to unlock vouching</h3>
        <p class="mt-1 text-sm text-amber-200/80">
          Email verification is required to vouch for other traders and build trust in the
          community. Check your inbox for a verification link.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <a
            href="/settings"
            class="rounded-md bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/30"
          >
            Go to Settings
          </a>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium text-amber-200/60 transition-colors hover:text-amber-100"
            onclick={() => {
              // TODO: Implement resend verification email
              alert('Resend verification email functionality coming soon!');
            }}
          >
            Resend verification email
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
