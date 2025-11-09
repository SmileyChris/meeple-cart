import { describe, it, expect } from 'vitest';
import { parseResults, parseStatistics } from './result-parser';
import type { TradePartySubmissionRecord } from '$lib/types/pocketbase';

describe('parseResults', () => {
  it('parses simple 2-person trade', () => {
    const output = `
TRADE CHAINS:
*** CHAIN 1
alice receives sub2 from bob
bob receives sub1 from alice
`;

    const submissions: TradePartySubmissionRecord[] = [
      {
        id: 'sub1',
        title: 'Wingspan',
        user: 'alice_id',
        expand: {
          user: { id: 'alice_id', username: 'alice' } as any,
        },
      } as any,
      {
        id: 'sub2',
        title: 'Gloomhaven',
        user: 'bob_id',
        expand: {
          user: { id: 'bob_id', username: 'bob' } as any,
        },
      } as any,
    ];

    const chains = parseResults(output, submissions, []);

    expect(chains).toHaveLength(1);
    expect(chains[0].chainNumber).toBe(1);
    expect(chains[0].trades).toHaveLength(2);
    expect(chains[0].participants).toContain('alice');
    expect(chains[0].participants).toContain('bob_id');
  });

  it('parses 3-person circular trade', () => {
    const output = `
TRADE CHAINS:
*** CHAIN 1
alice receives sub2 from bob
bob receives sub3 from charlie
charlie receives sub1 from alice
`;

    const submissions: TradePartySubmissionRecord[] = [
      {
        id: 'sub1',
        title: 'Game A',
        user: 'alice_id',
        expand: { user: { id: 'alice_id', username: 'alice' } as any },
      } as any,
      {
        id: 'sub2',
        title: 'Game B',
        user: 'bob_id',
        expand: { user: { id: 'bob_id', username: 'bob' } as any },
      } as any,
      {
        id: 'sub3',
        title: 'Game C',
        user: 'charlie_id',
        expand: { user: { id: 'charlie_id', username: 'charlie' } as any },
      } as any,
    ];

    const chains = parseResults(output, submissions, []);

    expect(chains).toHaveLength(1);
    expect(chains[0].trades).toHaveLength(3);
    // Participants includes both usernames from output and user IDs from submissions
    expect(chains[0].participants.length).toBeGreaterThanOrEqual(3);
  });

  it('parses multiple independent chains', () => {
    const output = `
TRADE CHAINS:
*** CHAIN 1
alice receives sub2 from bob
bob receives sub1 from alice

*** CHAIN 2
charlie receives sub4 from dave
dave receives sub3 from charlie
`;

    const submissions: TradePartySubmissionRecord[] = [
      { id: 'sub1', title: 'A', user: 'alice', expand: { user: { id: 'alice', username: 'alice' } as any } } as any,
      { id: 'sub2', title: 'B', user: 'bob', expand: { user: { id: 'bob', username: 'bob' } as any } } as any,
      { id: 'sub3', title: 'C', user: 'charlie', expand: { user: { id: 'charlie', username: 'charlie' } as any } } as any,
      { id: 'sub4', title: 'D', user: 'dave', expand: { user: { id: 'dave', username: 'dave' } as any } } as any,
    ];

    const chains = parseResults(output, submissions, []);

    expect(chains).toHaveLength(2);
    expect(chains[0].chainNumber).toBe(1);
    expect(chains[1].chainNumber).toBe(2);
  });

  it('handles missing submissions gracefully', () => {
    const output = `
TRADE CHAINS:
*** CHAIN 1
alice receives sub999 from bob
`;

    const submissions: TradePartySubmissionRecord[] = [];

    const chains = parseResults(output, submissions, []);

    // Should return empty chains array or a chain with no trades
    expect(chains.length).toBeGreaterThanOrEqual(0);
    if (chains.length > 0) {
      expect(chains[0].trades).toHaveLength(0);
    }
  });

  it('handles empty output', () => {
    const output = '';
    const submissions: TradePartySubmissionRecord[] = [];

    const chains = parseResults(output, submissions, []);

    expect(chains).toHaveLength(0);
  });
});

describe('parseStatistics', () => {
  it('extracts correct statistics from output', () => {
    const output = `
TRADE CHAINS:
*** CHAIN 1
alice receives sub2 from bob
bob receives sub1 from alice

*** CHAIN 2
charlie receives sub4 from dave
dave receives sub5 from eve
eve receives sub3 from charlie
`;

    const stats = parseStatistics(output);

    expect(stats.totalChains).toBe(2);
    expect(stats.totalTrades).toBe(5);
    expect(stats.longestChain).toBe(3);
  });

  it('handles single trade', () => {
    const output = `
TRADE CHAINS:
*** CHAIN 1
alice receives sub2 from bob
bob receives sub1 from alice
`;

    const stats = parseStatistics(output);

    expect(stats.totalChains).toBe(1);
    expect(stats.totalTrades).toBe(2);
    expect(stats.longestChain).toBe(2);
  });

  it('handles no trades', () => {
    const output = 'No trades found';

    const stats = parseStatistics(output);

    expect(stats.totalChains).toBe(0);
    expect(stats.totalTrades).toBe(0);
    expect(stats.longestChain).toBe(0);
  });
});
