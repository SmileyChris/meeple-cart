import { describe, it, expect } from 'vitest';
import { buildInput } from './input-builder';
import type { TradePartySubmissionRecord, TradePartyWantListRecord } from '$lib/types/pocketbase';

describe('buildInput', () => {
  it('generates correct TradeMaximizer format for simple submissions', () => {
    const submissions: TradePartySubmissionRecord[] = [
      {
        id: 'sub1',
        title: 'Wingspan',
        user: 'alice_id',
        trade_party: 'party1',
        condition: 'like_new',
        status: 'approved',
        expand: {
          user: { id: 'alice_id', username: 'alice', display_name: 'Alice' } as any,
        },
      } as any,
      {
        id: 'sub2',
        title: 'Gloomhaven',
        user: 'bob_id',
        trade_party: 'party1',
        condition: 'good',
        status: 'approved',
        expand: {
          user: { id: 'bob_id', username: 'bob', display_name: 'Bob' } as any,
        },
      } as any,
    ];

    const wantLists: TradePartyWantListRecord[] = [
      {
        id: 'want1',
        my_submission: 'sub1',
        wanted_submission: 'sub2',
        preference_rank: 1,
        expand: {
          my_submission: {
            ...submissions[0],
            expand: {
              user: { id: 'alice_id', username: 'alice' } as any,
            },
          } as any,
        },
      } as any,
    ];

    const input = buildInput(submissions, wantLists);

    expect(input).toContain('#!CASE-SENSITIVE');
    expect(input).toContain('#!ALLOW-DUMMIES');
    expect(input).toContain('!BEGIN-OFFICIAL-NAMES');
    expect(input).toContain('sub1 Wingspan');
    expect(input).toContain('sub2 Gloomhaven');
    expect(input).toContain('!END-OFFICIAL-NAMES');
    expect(input).toContain('(alice_id) sub2 : sub1');
  });

  it('escapes special characters in titles', () => {
    const submissions: TradePartySubmissionRecord[] = [
      {
        id: 'sub1',
        title: 'Game (with parens): Special Edition',
        user: 'alice',
        trade_party: 'party1',
        condition: 'mint',
        status: 'approved',
      } as any,
    ];

    const wantLists: TradePartyWantListRecord[] = [];

    const input = buildInput(submissions, wantLists);

    // Should remove parens and replace colons
    expect(input).toContain('sub1 Game with parens- Special Edition');
    expect(input).not.toContain('(with');
    expect(input).not.toContain('):');
  });

  it('handles multiple want list entries for same submission', () => {
    const submissions: TradePartySubmissionRecord[] = [
      { id: 'sub1', title: 'Game A', user: 'alice_id', expand: { user: { id: 'alice_id' } } } as any,
      { id: 'sub2', title: 'Game B', user: 'bob_id', expand: { user: { id: 'bob_id' } } } as any,
      { id: 'sub3', title: 'Game C', user: 'charlie_id', expand: { user: { id: 'charlie_id' } } } as any,
    ];

    const wantLists: TradePartyWantListRecord[] = [
      {
        id: 'want1',
        my_submission: 'sub1',
        wanted_submission: 'sub2',
        preference_rank: 1,
        expand: {
          my_submission: {
            expand: { user: { id: 'alice_id' } as any },
          } as any,
        },
      } as any,
      {
        id: 'want2',
        my_submission: 'sub1',
        wanted_submission: 'sub3',
        preference_rank: 2,
        expand: {
          my_submission: {
            expand: { user: { id: 'alice_id' } as any },
          } as any,
        },
      } as any,
    ];

    const input = buildInput(submissions, wantLists);

    // Both want entries should be present
    expect(input).toContain('(alice_id) sub2 : sub1');
    expect(input).toContain('(alice_id) sub3 : sub1');
  });

  it('handles circular trades (A wants B, B wants C, C wants A)', () => {
    const submissions: TradePartySubmissionRecord[] = [
      { id: 'sub1', title: 'Game A', user: 'alice_id', expand: { user: { id: 'alice_id' } } } as any,
      { id: 'sub2', title: 'Game B', user: 'bob_id', expand: { user: { id: 'bob_id' } } } as any,
      { id: 'sub3', title: 'Game C', user: 'charlie_id', expand: { user: { id: 'charlie_id' } } } as any,
    ];

    const wantLists: TradePartyWantListRecord[] = [
      {
        id: 'want1',
        my_submission: 'sub1',
        wanted_submission: 'sub2',
        preference_rank: 1,
        expand: {
          my_submission: {
            expand: { user: { id: 'alice_id' } as any },
          } as any,
        },
      } as any,
      {
        id: 'want2',
        my_submission: 'sub2',
        wanted_submission: 'sub3',
        preference_rank: 1,
        expand: {
          my_submission: {
            expand: { user: { id: 'bob_id' } as any },
          } as any,
        },
      } as any,
      {
        id: 'want3',
        my_submission: 'sub3',
        wanted_submission: 'sub1',
        preference_rank: 1,
        expand: {
          my_submission: {
            expand: { user: { id: 'charlie_id' } as any },
          } as any,
        },
      } as any,
    ];

    const input = buildInput(submissions, wantLists);

    expect(input).toContain('(alice_id) sub2 : sub1');
    expect(input).toContain('(bob_id) sub3 : sub2');
    expect(input).toContain('(charlie_id) sub1 : sub3');
  });

  it('handles empty submissions and want lists', () => {
    const input = buildInput([], []);

    expect(input).toContain('#!CASE-SENSITIVE');
    expect(input).toContain('!BEGIN-OFFICIAL-NAMES');
    expect(input).toContain('!END-OFFICIAL-NAMES');
  });
});
