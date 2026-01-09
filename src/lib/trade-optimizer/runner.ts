import { pb } from '$lib/pocketbase';
import type {
  TradePartyRecord,
  TradePartySubmissionRecord,
  TradePartyWantListRecord,
  TradePartyMatchRecord,
  TradeRecord,
} from '$lib/types/pocketbase';
import type { TradePartyContextRecord } from '$lib/types/trade-party-context';
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
 * 2. Build algorithm input (using user IDs)
 * 3. Run TradeMaximizer
 * 4. Parse results (extracting user IDs)
 * 5. Create match records
 * 6. Send notifications
 * 7. Update party status
 */
export async function runTradeMatching(partyId: string): Promise<RunResult> {
  try {
    // Step 1: Fetch all data needed
    const submissions = await fetchSubmissions(partyId);
    const wantLists = await fetchWantLists(partyId);

    if (!submissions || submissions.length === 0) {
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

    // Step 6: Create draft trade records and context from chains
    const matches = await createDraftTrades(partyId, chains);

    // Step 7: Update party status to 'matching_preview'
    await updatePartyStatus(partyId, 'matching_preview');

    // Step 8: Update matching_preview_at
    await pb.collection('trade_parties').update(partyId, {
      matching_preview_at: new Date().toISOString(),
    });

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
  const submissions = await pb.collection('trade_party_submissions').getFullList<TradePartySubmissionRecord>({
    filter: `trade_party = "${partyId}" && status = "approved"`,
  });

  const submissionIds = (submissions || []).map((s) => s.id);

  if (!submissionIds || submissionIds.length === 0) {
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
  // Clear context records (which will also help identify the related trades)
  const contexts = await pb.collection('trade_party_context').getFullList({
    filter: `party = "${partyId}"`,
  });

  if (contexts.length > 0) {
    // Delete related draft trades
    const draftTradeIds = contexts.map((c) => c.trade).filter(Boolean) as string[];

    await Promise.all([
      // Delete draft trades
      ...draftTradeIds.map((id) => pb.collection('trades').delete(id)),
      // Delete context records
      ...contexts.map((c) => pb.collection('trade_party_context').delete(c.id)),
    ]);
  }
}

/**
 * Create draft trade records and their context from parsed trade chains
 */
async function createDraftTrades(partyId: string, chains: any[]): Promise<TradeRecord[]> {
  const trades: TradeRecord[] = [];

  for (const chain of chains) {
    const chainId = `${partyId}_chain_${chain.chainNumber}`;

    for (let position = 0; position < chain.trades.length; position++) {
      const tradeData = chain.trades[position];

      // 1. Create the Trade record in draft state
      const trade = await pb.collection('trades').create<TradeRecord>(
        {
          buyer: tradeData.receivingUserId,
          seller: tradeData.givingUserId,
          status: 'initiated',
          offer_status: 'accepted',
          is_draft: true,
          // Since it's a party trade, listing is optional
          // We'll store item IDs in seller_items/buyer_items
          seller_items: [tradeData.givingSubmissionId], // In this context, giving_submission is the item
          buyer_items: [], // Trade parties are usually cycles of single items
        },
        { $autoCancel: false }
      );

      // 2. Create the Context record
      await pb.collection('trade_party_context').create<TradePartyContextRecord>(
        {
          trade: trade.id,
          party: partyId,
          chain_id: chainId,
          chain_position: position + 1,
          is_draft: true,
          giving_submission: tradeData.givingSubmissionId,
          receiving_submission: tradeData.receivingSubmissionId,
        },
        { $autoCancel: false }
      );

      trades.push(trade);
    }
  }

  return trades;
}

/**
 * Finalize trade matching for a party
 * This converts draft trades into real trades and notifies participants
 */
export async function finalizeTradeMatching(partyId: string): Promise<{ success: boolean }> {
  try {
    const party = await pb.collection('trade_parties').getOne<TradePartyRecord>(partyId);

    // 1. Fetch all context records for this party
    const contexts = await pb.collection('trade_party_context').getFullList<TradePartyContextRecord>({
      filter: `party = "${partyId}" && is_draft = true`,
      expand: 'trade',
    });

    if (!contexts || contexts.length === 0) {
      console.log('No matches to finalize for party:', partyId);
      return { success: true };
    }

    // 2. Update all trades and context records to be non-draft
    await Promise.all([
      // Update trades
      ...contexts.map((c) =>
        pb.collection('trades').update(c.trade as string, { is_draft: false }, { $autoCancel: false })
      ),
      // Update contexts
      ...contexts.map((c) =>
        pb
          .collection('trade_party_context')
          .update(c.id, { is_draft: false }, { $autoCancel: false })
      ),
    ]);

    // 3. Update party status and finalize timestamp
    await pb.collection('trade_parties').update(partyId, {
      status: 'execution',
      matching_finalized_at: new Date().toISOString(),
    });

    // 4. Send official notifications (since identities are now revealed)
    // We can reuse a modified version of sendMatchNotifications
    // but parsing users from trades this time
    const uniqueUserIds = new Set<string>();
    contexts.forEach((c) => {
      uniqueUserIds.add(c.expand?.trade?.buyer as string);
      uniqueUserIds.add(c.expand?.trade?.seller as string);
    });

    await Promise.all(
      Array.from(uniqueUserIds).map((userId) =>
        pb.collection('notifications').create({
          user: userId,
          type: 'trade_party_match',
          title: 'Trade Matches Finalized!',
          message: `The matches for "${party.name}" are now official! You can now view your trade partner identities and start shipping.`,
          link: `/trade-parties/${partyId}`,
          read: false,
        })
      )
    );

    return { success: true };
  } catch (err: any) {
    console.error('Failed to finalize trade matching:', err);
    throw err;
  }
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
