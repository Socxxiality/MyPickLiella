export interface CommunitySongStat {
  slug: string;
  title: string;
  artist: string;
  cover: string;
  count: number;
  percentage: number;
}

export interface CommunityOshiStat {
  id: string;
  name: string;
  nameJa: string;
  color: string;
  count: number;
  percentage: number;
}

export interface CommunityStats {
  ballots: number;
  selections: number;
  updatedAt: string | null;
  oshi: CommunityOshiStat[];
  group: CommunitySongStat[];
  unit: CommunitySongStat[];
  solo: CommunitySongStat[];
  others: CommunitySongStat[];
}

export const EMPTY_COMMUNITY_STATS: CommunityStats = {
  ballots: 0,
  selections: 0,
  updatedAt: null,
  oshi: [],
  group: [],
  unit: [],
  solo: [],
  others: [],
};
