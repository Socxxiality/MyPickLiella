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
  gen1: CommunitySongStat[];
  gen2: CommunitySongStat[];
  gen3: CommunitySongStat[];
  solo: CommunitySongStat[];
  unit: CommunitySongStat[];
  uta: CommunitySongStat[];
  others: CommunitySongStat[];
}

export const EMPTY_COMMUNITY_STATS: CommunityStats = {
  ballots: 0,
  selections: 0,
  updatedAt: null,
  gen1: [],
  gen2: [],
  gen3: [],
  solo: [],
  unit: [],
  uta: [],
  others: [],
};
