import type { RecordModel } from 'pocketbase';
import type { TradeRecord, TradePartyRecord, TradePartySubmissionRecord } from './pocketbase';

export interface TradePartyContextRecord extends RecordModel {
    trade?: string; // Relation to trades (optional until finalized)
    party: string;  // Relation to trade_parties
    chain_id: string;
    chain_position: number;
    is_draft: boolean;
    giving_submission: string;
    receiving_submission: string;

    expand?: {
        trade?: TradeRecord;
        party?: TradePartyRecord;
        giving_submission?: TradePartySubmissionRecord;
        receiving_submission?: TradePartySubmissionRecord;
    };
}
