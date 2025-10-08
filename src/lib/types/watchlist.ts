import type { RecordModel } from 'pocketbase';

export interface WatchlistRecord extends RecordModel {
  user: string;
  listing?: string;
  bgg_id?: number;
  max_price?: number;
  max_distance?: number;
}
