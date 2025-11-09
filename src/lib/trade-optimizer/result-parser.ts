import type { TradePartySubmissionRecord, TradePartyWantListRecord } from '$lib/types/pocketbase';
import type { TradeChain, Trade } from './types';

/**
 * Parse TradeMaximizer output into structured trade chains
 *
 * Example output:
 * TRADE CHAINS:
 * *** CHAIN 1
 * alice receives game2 from bob
 * bob receives game3 from charlie
 * charlie receives game1 from alice
 *
 * *** CHAIN 2
 * ...
 */
export function parseResults(
  output: string,
  submissions: TradePartySubmissionRecord[],
  wantLists: TradePartyWantListRecord[]
): TradeChain[] {
  const chains: TradeChain[] = [];
  const lines = output.split('\n');

  let currentChain: TradeChain | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Chain header: "*** CHAIN 1" or "*** CHAIN 2", etc.
    if (trimmedLine.startsWith('*** CHAIN')) {
      // Save previous chain if it exists
      if (currentChain && currentChain.trades.length > 0) {
        chains.push(currentChain);
      }

      // Start new chain
      const chainNumberMatch = trimmedLine.match(/\*\*\* CHAIN (\d+)/);
      const chainNumber = chainNumberMatch ? parseInt(chainNumberMatch[1]) : chains.length + 1;

      currentChain = {
        chainNumber,
        trades: [],
        participants: [],
      };
      continue;
    }

    // Trade line: "alice receives submission_id from bob"
    const tradeMatch = trimmedLine.match(/^(\w+) receives (.+?) from (\w+)/);
    if (tradeMatch && currentChain) {
      const [, receivingUser, submissionId, givingUser] = tradeMatch;

      // Find the submission
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) {
        console.warn(`Submission not found: ${submissionId}`);
        continue;
      }

      // Add trade to chain
      currentChain.trades.push({
        givingSubmissionId: submissionId,
        receivingSubmissionId: submissionId,
        givingUserId: submission.expand?.user?.id || givingUser,
        receivingUserId: receivingUser,
        submission,
      });

      // Track participants
      const givingUserId = submission.expand?.user?.id || givingUser;
      if (!currentChain.participants.includes(receivingUser)) {
        currentChain.participants.push(receivingUser);
      }
      if (!currentChain.participants.includes(givingUserId)) {
        currentChain.participants.push(givingUserId);
      }
    }
  }

  // Push last chain
  if (currentChain && currentChain.trades.length > 0) {
    chains.push(currentChain);
  }

  return chains;
}

/**
 * Extract summary statistics from TradeMaximizer output
 */
export function parseStatistics(output: string): {
  totalTrades: number;
  totalChains: number;
  longestChain: number;
} {
  const chains = output.match(/\*\*\* CHAIN \d+/g) || [];
  const trades = output.match(/\w+ receives .+ from \w+/g) || [];

  // Find longest chain by counting trades between chain markers
  let longestChain = 0;
  let currentChainLength = 0;

  for (const line of output.split('\n')) {
    if (line.trim().startsWith('*** CHAIN')) {
      if (currentChainLength > longestChain) {
        longestChain = currentChainLength;
      }
      currentChainLength = 0;
    } else if (line.match(/\w+ receives .+ from \w+/)) {
      currentChainLength++;
    }
  }

  if (currentChainLength > longestChain) {
    longestChain = currentChainLength;
  }

  return {
    totalTrades: trades.length,
    totalChains: chains.length,
    longestChain,
  };
}
