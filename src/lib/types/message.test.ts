import { describe, it, expect } from 'vitest';
import { generateThreadId, generatePublicThreadId } from './message';

describe('generateThreadId', () => {
  it('generates consistent thread ID regardless of user order', () => {
    const user1 = 'user-abc';
    const user2 = 'user-xyz';

    const thread1 = generateThreadId(user1, user2);
    const thread2 = generateThreadId(user2, user1);

    expect(thread1).toBe(thread2);
  });

  it('generates different thread IDs for different user pairs', () => {
    const user1 = 'user-abc';
    const user2 = 'user-xyz';
    const user3 = 'user-def';

    const thread1 = generateThreadId(user1, user2);
    const thread2 = generateThreadId(user1, user3);

    expect(thread1).not.toBe(thread2);
  });

  it('includes both user IDs in the thread ID', () => {
    const user1 = 'user-abc';
    const user2 = 'user-xyz';

    const threadId = generateThreadId(user1, user2);

    expect(threadId).toContain('user-abc');
    expect(threadId).toContain('user-xyz');
  });

  it('sorts user IDs alphabetically', () => {
    const threadId = generateThreadId('user-xyz', 'user-abc');

    // user-abc should come first alphabetically
    expect(threadId).toBe('thread_user-abc_user-xyz');
  });
});

describe('generatePublicThreadId', () => {
  it('generates thread ID with listing ID', () => {
    const listingId = 'listing-123';
    const threadId = generatePublicThreadId(listingId);

    expect(threadId).toBe('public_listing-123');
  });

  it('generates different IDs for different listings', () => {
    const thread1 = generatePublicThreadId('listing-123');
    const thread2 = generatePublicThreadId('listing-456');

    expect(thread1).not.toBe(thread2);
  });
});
