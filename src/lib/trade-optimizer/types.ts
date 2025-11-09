import type { TradePartySubmissionRecord } from '$lib/types/pocketbase';

export interface Trade {
  givingSubmissionId: string;
  receivingSubmissionId: string;
  givingUserId: string;
  receivingUserId: string;
  submission: TradePartySubmissionRecord;
}

export interface TradeChain {
  chainNumber: number;
  trades: Trade[];
  participants: string[]; // User IDs
}

export interface OptimizationResult {
  chains: TradeChain[];
  totalTrades: number;
  totalUsers: number;
  input: string; // Debug - TradeMaximizer input format
  output: string; // Debug - TradeMaximizer raw output
}

export interface TradeMaximizerOptions {
  allowDummies?: boolean;
  caseSensitive?: boolean;
  metric?: 'CHAIN-SIZES-SOS' | 'USERS-TRADING';
  iterations?: number;
  priorityScheme?: 'LINEAR' | 'TRIANGLE' | 'SQUARE';
}
