import type { RecordModel } from 'pocketbase';

/**
 * BoardGameGeek metadata record
 *
 * Per-user cache of BGG game data. Each user fetches their own BGG data
 * when creating listings. Prevents cross-contamination of BGG data between users.
 *
 * Trust model: Users fetch BGG data from their browser. If they fake it,
 * it only affects their own listings.
 */
export interface BggInfoRecord extends RecordModel {
  // User who fetched this BGG data
  user: string; // User ID relation

  // Core identifiers
  bgg_id: number;
  title: string;
  year_published?: number;
  description?: string;

  // Media (URLs from BGG)
  thumbnail_url?: string;
  image_url?: string;

  // Gameplay data
  min_players?: number;
  max_players?: number;
  min_playtime?: number;
  max_playtime?: number;
  min_age?: number;

  // Ratings and statistics
  average_rating?: number;
  rating_stddev?: number;
  num_ratings?: number;
  complexity_weight?: number;
  bgg_rank?: number;

  // Taxonomy (JSON arrays)
  categories?: string[];
  mechanics?: string[];
  designers?: string[];
  publishers?: string[];

  // Cache management
  last_fetched: string; // ISO date string
  fetch_error?: string; // Error message if last fetch failed
}

/**
 * BGG XML API2 response types
 */

export interface BggThingResponse {
  items: BggThing[];
  termsofuse: string;
}

export interface BggThing {
  type: 'boardgame' | 'boardgameexpansion' | 'boardgameaccessory';
  id: number;
  thumbnail?: string;
  image?: string;
  names: BggName[];
  description?: string;
  yearpublished?: number;
  minplayers?: number;
  maxplayers?: number;
  playingtime?: number;
  minplaytime?: number;
  maxplaytime?: number;
  minage?: number;
  polls?: BggPoll[];
  links?: BggLink[];
  statistics?: BggStatistics;
}

export interface BggName {
  type: 'primary' | 'alternate';
  sortindex: number;
  value: string;
}

export interface BggPoll {
  name: string;
  title: string;
  totalvotes: number;
  results: BggPollResult[];
}

export interface BggPollResult {
  numplayers?: string;
  result: Array<{
    value: string;
    numvotes: number;
  }>;
}

export interface BggLink {
  type:
    | 'boardgamecategory'
    | 'boardgamemechanic'
    | 'boardgamefamily'
    | 'boardgamedesigner'
    | 'boardgameartist'
    | 'boardgamepublisher'
    | 'boardgameexpansion';
  id: number;
  value: string;
}

export interface BggStatistics {
  ratings: {
    usersrated: number;
    average: number;
    bayesaverage: number;
    stddev: number;
    median: number;
    owned: number;
    trading: number;
    wanting: number;
    wishing: number;
    numcomments: number;
    numweights: number;
    averageweight: number;
    ranks?: BggRank[];
  };
}

export interface BggRank {
  type: 'subtype' | 'family';
  id: number;
  name: string;
  friendlyname: string;
  value: number | 'Not Ranked';
  bayesaverage: number;
}

/**
 * BGG Search API response types
 */

export interface BggSearchResponse {
  total: number;
  items: BggSearchItem[];
  termsofuse: string;
}

export interface BggSearchItem {
  type: 'boardgame' | 'boardgameexpansion' | 'boardgameaccessory';
  id: number;
  name: {
    type: 'primary';
    value: string;
  };
  yearpublished?: {
    value: number;
  };
}
