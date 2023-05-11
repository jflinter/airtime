import { heightFromSeconds } from '@/lib/heightFromSeconds';
import { LeaderboardEntry, fetchScores, supabase } from '@/lib/supabaseClient';
import { usePlayerInfo } from '@/lib/usePlayerInfo';
import classNames from 'classnames';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Fame() {
  const [playerInfo] = usePlayerInfo();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mode, setMode] = useState<'case' | 'no-case'>('no-case');
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchScores(mode === 'case').then(setLeaderboard);
    });
    return () => clearTimeout(timeout);
  }, [mode]);

  return (
    <main className={`flex w-full flex-col items-center`}>
      <div className="sticky w-full top-0 z-50 bg-white shadow mb-4">
        <div className="w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href={`/`} className="text-blue-600 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="ml-1">Back</span>
              </Link>
            </div>
            <div className="text-center flex flex-col space-y-2">
              <h1 className={`text-xl font-semibold`}>the highest phones</h1>
              <div className="bg-gray-200 rounded-full w-full flex h-[35px] border border-gray-200 whitespace-nowrap">
                <button
                  onClick={() => setMode('no-case')}
                  className={classNames(
                    'rounded-full focus:outline-none px-3 py-1',
                    { 'bg-white text-blue-600': mode === 'no-case' },
                    { 'bg-none text-gray-600': mode === 'case' }
                  )}
                >
                  No Case 🤙
                </button>
                <button
                  onClick={() => setMode('case')}
                  className={classNames(
                    'rounded-full focus:outline-none px-3 py-1',
                    { 'bg-white text-blue-600': mode === 'case' },
                    { 'bg-none text-gray-600': mode === 'no-case' }
                  )}
                >
                  Case 👼
                </button>
              </div>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </div>
      {leaderboard.map((entry, i) => (
        <div
          key={entry.id}
          className={classNames({
            'text-blue-600': entry.playerId === playerInfo?.playerId,
          })}
        >
          {i + 1}. {entry.name} -{' '}
          {heightFromSeconds(entry.durationMs / 1000).toFixed(1)}ft,{' '}
          {entry.date.toLocaleDateString()}
        </div>
      ))}
    </main>
  );
}
