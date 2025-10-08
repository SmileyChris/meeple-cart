import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import MessageBubble from './MessageBubble.svelte';
import type { MessageItem } from '$lib/types/message';

describe('MessageBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseMessage: MessageItem = {
    id: '1',
    content: 'Hello! Is this game still available?',
    senderName: 'John Doe',
    senderId: 'user-123',
    timestamp: '2025-01-15T10:00:00Z',
    isPublic: false,
    isRead: false,
    isOwnMessage: false,
  };

  it('renders message content', () => {
    const { getByText } = render(MessageBubble, { props: { message: baseMessage } });
    expect(getByText('Hello! Is this game still available?')).toBeTruthy();
  });

  it('shows sender name for other user messages', () => {
    const { getByText } = render(MessageBubble, { props: { message: baseMessage } });
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('does not show sender name for own messages', () => {
    const ownMessage: MessageItem = { ...baseMessage, isOwnMessage: true, senderId: 'user-456' };
    const { queryByText } = render(MessageBubble, { props: { message: ownMessage } });
    expect(queryByText('John Doe')).toBeNull();
  });

  it('shows read status for own messages', () => {
    const readMessage: MessageItem = { ...baseMessage, isOwnMessage: true, isRead: true };
    const { getByText } = render(MessageBubble, { props: { message: readMessage } });
    expect(getByText('✓ Read')).toBeTruthy();
  });

  it('does not show read status for unread own messages', () => {
    const unreadMessage: MessageItem = { ...baseMessage, isOwnMessage: true, isRead: false };
    const { queryByText } = render(MessageBubble, { props: { message: unreadMessage } });
    expect(queryByText('✓ Read')).toBeNull();
  });

  it('displays relative time', () => {
    const now = new Date('2025-01-15T10:30:00Z');
    vi.setSystemTime(now);

    const recentMessage: MessageItem = {
      ...baseMessage,
      timestamp: '2025-01-15T10:00:00Z', // 30 minutes ago
    };

    const { getByText } = render(MessageBubble, { props: { message: recentMessage } });
    expect(getByText('30 minutes ago')).toBeTruthy();
  });

  it('applies correct alignment for own messages', () => {
    const ownMessage: MessageItem = { ...baseMessage, isOwnMessage: true };
    const { container } = render(MessageBubble, { props: { message: ownMessage } });
    const bubbleContainer = container.querySelector('.ml-auto');
    expect(bubbleContainer).toBeTruthy();
  });

  it('applies correct alignment for other user messages', () => {
    const { container } = render(MessageBubble, { props: { message: baseMessage } });
    const bubbleContainer = container.querySelector('.mr-auto');
    expect(bubbleContainer).toBeTruthy();
  });
});
