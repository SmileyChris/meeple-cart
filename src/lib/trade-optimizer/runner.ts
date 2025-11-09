import { pb } from '$lib/pocketbase';
import type {
  TradePartyRecord,
  TradePartySubmissionRecord,
  TradePartyWantListRecord,
  TradePartyMatchRecord,
} from '$lib/types/pocketbase';
import { buildInput } from './input-builder';
import { parseResults, parseStatistics } from './result-parser';
import { TradeMaximizer } from './algorithm/trademax';

export interface RunResult {
  success: boolean;
  matchCount: number;
  chainCount: number;
  errorMessage?: string;
  output?: string;
}

/**
 * Run the trade matching algorithm for a trade party
 * This orchestrates the entire process:
 * 1. Fetch submissions and want lists from PocketBase
 * 2. Build algorithm input
 * 3. Run TradeMaximizer
 * 4. Parse results
 * 5. Create match records
 * 6. Send notifications
 * 7. Update party status
 */
export async function runTradeMatching(partyId: string): Promise<RunResult> {
  try {
    // Step 1: Fetch all data needed
    const submissions = await fetchSubmissions(partyId);
    const wantLists = await fetchWantLists(partyId);

    if (submissions.length === 0) {
      return {
        success: false,
        matchCount: 0,
        chainCount: 0,
        errorMessage: 'No submissions found for this party',
      };
    }

    if (wantLists.length === 0) {
      return {
        success: false,
        matchCount: 0,
        chainCount: 0,
        errorMessage: 'No want lists found for this party',
      };
    }

    // Step 2: Build algorithm input
    const input = buildInput(submissions, wantLists);

    // Step 3: Run TradeMaximizer
    const algorithmOutput = await runAlgorithm(input);

    // Step 4: Parse results
    const chains = parseResults(algorithmOutput, submissions, wantLists);
    const stats = parseStatistics(algorithmOutput);

    // Step 5: Clear existing matches (if re-running)
    await clearExistingMatches(partyId);

    // Step 6: Create match records from chains
    const matches = await createMatchRecords(partyId, chains);

    // Step 7: Send notifications to matched participants
    await sendMatchNotifications(partyId, chains, matches);

    // Step 8: Update party status to 'matching_complete'
    await updatePartyStatus(partyId, 'matching_complete');

    return {
      success: true,
      matchCount: stats.totalTrades,
      chainCount: stats.totalChains,
      output: algorithmOutput,
    };
  } catch (err: any) {
    console.error('Failed to run trade matching:', err);
    return {
      success: false,
      matchCount: 0,
      chainCount: 0,
      errorMessage: err.message || 'Unknown error occurred',
    };
  }
}

/**
 * Fetch all approved submissions for a party
 */
async function fetchSubmissions(partyId: string): Promise<TradePartySubmissionRecord[]> {
  return await pb.collection('trade_party_submissions').getFullList({
    filter: `trade_party = "${partyId}" && status = "approved"`,
    expand: 'user',
  });
}

/**
 * Fetch all want lists for submissions in a party
 */
async function fetchWantLists(partyId: string): Promise<TradePartyWantListRecord[]> {
  // First get all submissions for this party
  const submissions = await fetchSubmissions(partyId);
  const submissionIds = submissions.map((s) => s.id);

  if (submissionIds.length === 0) {
    return [];
  }

  // Build filter to get want lists for these submissions
  const filter = submissionIds.map((id) => `my_submission = "${id}"`).join(' || ');

  return await pb.collection('trade_party_want_lists').getFullList({
    filter: `(${filter}) && wanted_submission != ""`,
    expand: 'my_submission,my_submission.user,wanted_submission',
    sort: 'preference_rank',
  });
}

/**
 * Run the TradeMaximizer algorithm
 */
async function runAlgorithm(input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tm = new TradeMaximizer();
    let output = '';

    // Split input into lines for the algorithm's input function
    const lines = input.split('\n');
    let lineIndex = 0;

    const inputFunc = () => {
      if (lineIndex >= lines.length) return null;
      return lines[lineIndex++];
    };

    const outputFunc = (s: string, newline: boolean) => {
      output += s + (newline ? '\n' : '');
    };

    const fatalFunc = (message: string) => {
      reject(new Error(message));
    };

    try {
      tm.run(inputFunc, outputFunc, undefined, fatalFunc);
      resolve(output);
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Clear existing matches for a party (if re-running algorithm)
 */
async function clearExistingMatches(partyId: string): Promise<void> {
  const existingMatches = await pb.collection('trade_party_matches').getFullList({
    filter: `trade_party = "${partyId}"`,
  });

  await Promise.all(
    existingMatches.map((match) => pb.collection('trade_party_matches').delete(match.id))
  );
}

/**
 * Create match records from parsed trade chains
 */
async function createMatchRecords(
  partyId: string,
  chains: any[]
): Promise<TradePartyMatchRecord[]> {
  const matches: TradePartyMatchRecord[] = [];

  for (const chain of chains) {
    const chainId = `${partyId}_chain_${chain.chainNumber}`;

    for (let position = 0; position < chain.trades.length; position++) {
      const trade = chain.trades[position];
      const match = await pb.collection('trade_party_matches').create<TradePartyMatchRecord>({
        trade_party: partyId,
        chain_id: chainId,
        chain_position: position + 1,
        giving_submission: trade.givingSubmissionId,
        receiving_submission: trade.receivingSubmissionId,
        giving_user: trade.givingUserId,
        receiving_user: trade.receivingUserId,
        status: 'pending',
      });

      matches.push(match);
    }
  }

  return matches;
}

/**
 * Send notifications to all matched participants
 */
async function sendMatchNotifications(
  partyId: string,
  chains: any[],
  matches: TradePartyMatchRecord[]
): Promise<void> {
  const party = await pb.collection('trade_parties').getOne<TradePartyRecord>(partyId);

  // Collect unique users from all chains
  const uniqueUsers = new Set<string>();
  for (const chain of chains) {
    for (const participant of chain.participants) {
      uniqueUsers.add(participant);
    }
  }

  // Send notification to each participant
  await Promise.all(
    Array.from(uniqueUsers).map((userId) =>
      pb.collection('notifications').create({
        user: userId,
        type: 'trade_party_match',
        title: 'Trade Matches Found!',
        message: `The algorithm has found matches for "${party.name}". Check the results to see your trades.`,
        link: `/trade-parties/${partyId}`,
        read: false,
      })
    )
  );

  // Also notify the organizer
  await pb.collection('notifications').create({
    user: party.organizer,
    type: 'trade_party_match',
    title: 'Matching Complete',
    message: `Trade matching completed for "${party.name}". ${matches.length} matches created across ${chains.length} trade chains.`,
    link: `/trade-parties/${partyId}`,
    read: false,
  });
}

/**
 * Update party status after algorithm runs
 */
async function updatePartyStatus(
  partyId: string,
  status: TradePartyRecord['status']
): Promise<void> {
  await pb.collection('trade_parties').update(partyId, {
    status,
  });
}
