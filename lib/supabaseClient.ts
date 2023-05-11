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
};

export type ScoreRequest = {
  playerId: string;
  playerName: string;
  durationMs: number;
  hasCase: boolean;
};

export const createScore = async ({
  playerId,
  playerName,
  durationMs,
  hasCase,
}: ScoreRequest): Promise<void> => {
  await supabase
    .from('scores')
    .insert({
      player_id: playerId,
      player_name: playerName,
      duration_ms: durationMs,
      has_case: hasCase,
    })
    .single();
};

export const fetchScores = async (): Promise<LeaderboardEntry[]> => {
  return (
    (await supabase
      .from('scores')
      .select('*')
      .order('duration_ms', { ascending: true })
      .then(({ data }) => {
        if (data) {
          return data.map((d) => {
            return {
              id: d.id,
              name: d.player_name,
              durationMs: d.duration_ms,
              date: new Date(d.created_at),
            };
          });
        }
      })) ?? []
  );
};
