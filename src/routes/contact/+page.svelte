<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import { generateThreadId } from '$lib/types/message';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let developer = $derived(data.developer);

  // Generate thread ID for messaging the developer
  let developerThreadId = $derived(
    developer && $currentUser ? generateThreadId($currentUser.id, developer.id) : null
  );
</script>

<svelte:head>
  <title>Contact · Meeple Cart</title>
  <meta name="description" content="Get in touch with the Meeple Cart team" />
</svelte:head>

<main class="space-y-10 bg-surface-body pb-16 transition-colors">
  <section class="px-6 pt-16 sm:px-8">
    <div class="mx-auto max-w-5xl space-y-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-muted">
        <a href="/about" class="transition hover:text-secondary">About</a>
        <span>→</span>
        <span class="text-secondary">Contact</span>
      </nav>

      <!-- Header -->
      <div class="space-y-4">
        <h1 class="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
          Contact & Support
        </h1>
        <p class="text-lg text-secondary">
          Meeple Cart is a community-driven, peer-to-peer platform
        </p>
      </div>

      <!-- About the Platform -->
      <div class="rounded-xl border border-subtle bg-surface-panel p-6">
        <h2 class="mb-4 text-2xl font-bold text-primary">How Meeple Cart Works</h2>
        <div class="space-y-3 text-secondary">
          <p>Meeple Cart is a low-touch, peer-to-peer trading platform. This means:</p>
          <ul class="ml-6 space-y-2 list-disc">
            <li>You trade directly with other community members</li>
            <li>The community is self-monitoring through ratings, vouches, and discussions</li>
            <li>There's no central support team handling disputes or transactions</li>
            <li>Platform development is open source and community-driven</li>
          </ul>
        </div>
      </div>

      <!-- Contact Developer -->
      {#if developer && $currentUser && developerThreadId}
        <div class="rounded-xl border border-accent bg-accent/5 p-6">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-primary">
            <span class="text-2xl">👨‍💻</span>
            Contact the Developer
          </h2>
          <div class="space-y-3 text-secondary">
            <p>
              For serious issues, platform-wide concerns, or questions that don't fit the categories
              below, you can message <strong>Chris Beaven</strong>, the main developer.
            </p>
            <a
              href="/messages/{developerThreadId}"
              class="mt-4 inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
            >
              Send Message to {developer.display_name || 'Chris'}
            </a>
          </div>
        </div>
      {/if}

      <!-- Getting Help -->
      <div class="space-y-6">
        <!-- Trading Issues -->
        <div class="rounded-xl border border-subtle bg-surface-panel p-6">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-primary">
            <span class="text-2xl">🤝</span>
            Trading Issues or Disputes
          </h2>
          <div class="space-y-3 text-secondary">
            <p>If you're having an issue with another member or a trade:</p>
            <ol class="ml-6 space-y-2 list-decimal">
              <li>
                Try to resolve it directly with the other party through respectful communication
              </li>
              <li>
                Start a discussion in <a href="/discussions" class="text-accent hover:underline"
                  >Discussions</a
                > to get community input and advice
              </li>
              <li>Leave honest feedback and reviews to help others make informed decisions</li>
            </ol>
            <p class="mt-4 text-sm text-muted">
              See our <a href="/rules#resolving-issues" class="text-accent hover:underline"
                >Site Rules</a
              > for more on resolving issues.
            </p>
          </div>
        </div>

        <!-- Suggestions -->
        <div class="rounded-xl border border-subtle bg-surface-panel p-6">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-primary">
            <span class="text-2xl">💡</span>
            Suggestions & Feature Ideas
          </h2>
          <div class="space-y-3 text-secondary">
            <p>Have an idea to improve Meeple Cart? We'd love to hear it!</p>
            <p>
              Share your suggestions in the <a
                href="/discussions"
                class="text-accent hover:underline">Discussions</a
              > section where the community can discuss and vote on ideas.
            </p>
            <a
              href="/discussions"
              class="mt-4 inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
            >
              Start a Discussion
            </a>
          </div>
        </div>

        <!-- Technical Issues -->
        <div class="rounded-xl border border-subtle bg-surface-panel p-6">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-primary">
            <span class="text-2xl">🐛</span>
            Technical Issues or Bugs
          </h2>
          <div class="space-y-3 text-secondary">
            <p>Found a bug or experiencing technical problems with the platform?</p>
            <p>Report it on our GitHub repository where developers can track and fix the issue.</p>
            <a
              href="https://github.com/smileychris/meeple-cart/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center gap-2 rounded-lg border border-subtle bg-surface-card px-4 py-2 font-semibold text-secondary transition hover:border-accent hover:text-primary"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                />
              </svg>
              Report on GitHub
            </a>
          </div>
        </div>

        <!-- Privacy Concerns -->
        <div class="rounded-xl border border-subtle bg-surface-panel p-6">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-bold text-primary">
            <span class="text-2xl">🔒</span>
            Privacy & Data Concerns
          </h2>
          <div class="space-y-3 text-secondary">
            <p>For questions about your data, privacy, or to exercise your data rights:</p>
            <ul class="ml-6 space-y-1 list-disc">
              <li>
                Review our <a href="/terms#data-rights" class="text-accent hover:underline"
                  >Privacy Policy</a
                >
              </li>
              <li>Delete your account anytime from account settings</li>
              <li>
                For specific privacy concerns, open an issue on <a
                  href="https://github.com/smileychris/meeple-cart/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-accent hover:underline">GitHub</a
                >
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Community First -->
      <div class="rounded-xl border border-accent bg-accent/5 p-6 text-center">
        <h2 class="mb-2 text-2xl font-bold text-primary">Community-Powered Platform</h2>
        <p class="text-secondary">
          Meeple Cart thrives because of our community. By helping each other, sharing knowledge in
          discussions, and maintaining transparency through reviews and ratings, we build a
          trustworthy trading environment together.
        </p>
      </div>
    </div>
  </section>
</main>
