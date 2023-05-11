import { heightFromSeconds } from '@/lib/heightFromSeconds';
import { LeaderboardEntry, fetchScores, supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Fame() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchScores().then(setLeaderboard);
    });
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className={`pt-4 flex w-full flex-col items-center`}>
      <h1 className={`text-xl font-semibold`}>the highest phones</h1>
      {leaderboard.map((entry, i) => (
        <div key={entry.id}>
          {i + 1}. {entry.name} -{' '}
          {heightFromSeconds(entry.durationMs / 1000).toFixed(1)}ft,{' '}
          {entry.date.toLocaleDateString()}
        </div>
      ))}
    </main>
  );
}
