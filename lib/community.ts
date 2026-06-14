export interface CommunitySongStat {
  slug: string;
  title: string;
  artist: string;
  cover: string;
  count: number;
  percentage: number;
}

export interface CommunityStats {
  ballots: number;
  selections: number;
  updatedAt: string | null;
  group: CommunitySongStat[];
  unit: CommunitySongStat[];
  solo: CommunitySongStat[];
  others: CommunitySongStat[];
}

export const EMPTY_COMMUNITY_STATS: CommunityStats = {
  ballots: 0,
  selections: 0,
  updatedAt: null,
  group: [],
  unit: [],
  solo: [],
  others: [],
};
