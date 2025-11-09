import type { TradePartySubmissionRecord, TradePartyWantListRecord } from '$lib/types/pocketbase';

/**
 * Build TradeMaximizer input format from submissions and want lists
 *
 * Format:
 * #!CASE-SENSITIVE
 * #!ALLOW-DUMMIES
 *
 * !BEGIN-OFFICIAL-NAMES
 * submission_id Game Title
 * !END-OFFICIAL-NAMES
 *
 * (username) wanted_id : offered_id
 */
export function buildInput(
  submissions: TradePartySubmissionRecord[],
  wantLists: TradePartyWantListRecord[]
): string {
  const lines: string[] = [];

  // Header with options
  lines.push('#!CASE-SENSITIVE');
  lines.push('#!ALLOW-DUMMIES');
  lines.push('');

  // Official names section - maps submission IDs to titles
  lines.push('!BEGIN-OFFICIAL-NAMES');

  for (const submission of submissions) {
    const title = escapeTitle(submission.title);
    lines.push(`${submission.id} ${title}`);
  }

  lines.push('!END-OFFICIAL-NAMES');
  lines.push('');

  // Want list entries
  // Format: (username) wanted_submission_id : offering_submission_id
  for (const want of wantLists) {
    const username = want.expand?.my_submission?.expand?.user?.username ?? 'unknown';
    const wantedId = want.wanted_submission;
    const offeredId = want.my_submission;

    lines.push(`(${username}) ${wantedId} : ${offeredId}`);
  }

  return lines.join('\n');
}

/**
 * Escape title to avoid conflicts with TradeMaximizer format
 * Remove parentheses and other special characters
 */
function escapeTitle(title: string): string {
  return title
    .replace(/[()]/g, '') // Remove parentheses (used for usernames)
    .replace(/:/g, '-') // Replace colons (used as separator)
    .trim();
}
