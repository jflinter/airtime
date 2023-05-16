import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://hdfaiysbnbanqshkbamz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZmFpeXNibmJhbnFzaGtiYW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODM3NTY3NjQsImV4cCI6MTk5OTMzMjc2NH0.cz9KUNmBhsXDXu86gjFxPdX8OgRevuvBMbDi6XKT_j0'
);

export type LeaderboardEntry = {
  id: string;
  name: string;
  durationMs: number;
  date: Date;
  playerId: string;
};

export type ScoreRequest = {
  throwId: string;
  playerId: string;
  playerName: string;
  durationMs: number;
  hasCase: boolean;
};

export type VideoRequest = {
  throwId: string;
  video: File;
};

export const uploadVideo = async ({
  throwId,
  video,
}: VideoRequest): Promise<void> => {
  await supabase.storage.from('journeys').upload(video.name, video);
};

export const createScore = async ({
  throwId,
  playerId,
  playerName,
  durationMs,
  hasCase,
}: ScoreRequest): Promise<number | null> => {
  try {
    const result = await supabase
      .from('scores')
      .insert({
        local_id: throwId,
        player_id: playerId,
        player_name: playerName,
        duration_ms: durationMs.toFixed(0),
        has_case: hasCase,
      })
      .select('id')
      .single()
      .then((res) => res.data);
    if (!result) {
      return null;
    }
    const leaderboard = await fetchScores(hasCase, true);
    const index = leaderboard.findIndex((e) => e.id === result.id);
    return index > 0 ? index : null;
  } catch (e) {
    debugger;
    console.error(e);
    return null;
  }
};

export const fetchScores = async (
  hasCase: boolean,
  todayOnly: boolean
): Promise<LeaderboardEntry[]> => {
  return (
    (await supabase
      .from(todayOnly ? 'daily_leaderboard' : 'leaderboard')
      .select('*')
      .eq('has_case', hasCase)
      .limit(100)
      .then(({ data }) => {
        if (data) {
          return data.map((d) => {
            return {
              id: d.id,
              name: d.player_name,
              durationMs: d.max_duration,
              date: new Date(d.created_at),
              hasCase: d.has_case,
              playerId: d.player_id,
            };
          });
        }
      })) ?? []
  );
};
