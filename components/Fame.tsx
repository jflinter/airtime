import { heightFromSeconds } from '@/lib/heightFromSeconds';
import { LeaderboardEntry, fetchScores, supabase } from '@/lib/supabaseClient';
import { usePlayerInfo } from '@/lib/usePlayerInfo';
import classNames from 'classnames';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Props = {
  onBack: () => void;
};

type SegmentedControlProps = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

const SegmentedControl = ({
  options,
  selectedIndex,
  onChange,
}: SegmentedControlProps) => {
  return (
    <div className="bg-gray-200 rounded-full w-full flex h-[35px] border border-gray-200 whitespace-nowrap">
      {options.map((option, i) => {
        return (
          <button
            key={option}
            onClick={() => onChange(i)}
            className={classNames(
              'rounded-full focus:outline-none px-3 py-1 text-sm',
              { 'bg-white text-blue-600': selectedIndex === i },
              { 'bg-none text-gray-600': selectedIndex === i }
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default function Fame({ onBack }: Props) {
  const { playerInfo } = usePlayerInfo();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mode, setMode] = useState<'case' | 'no-case'>(
    playerInfo?.hasCase ? 'case' : 'no-case'
  );
  const [timeWindow, setTimeWindow] = useState<'daily' | 'all-time'>('daily');
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchScores(mode === 'case', timeWindow === 'daily').then(setLeaderboard);
    });
    return () => clearTimeout(timeout);
  }, [mode, timeWindow]);

  return (
    <main className={`flex w-full flex-col items-center`}>
      <div className="sticky w-full top-0 z-50 bg-white shadow-bottom mb-4">
        <div className="w-full mx-auto pb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link
                href={`#`}
                onClick={onBack}
                className="text-blue-600 flex items-center"
              >
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
                <span className="ml-0">Back</span>
              </Link>
            </div>
            <div className="text-center flex flex-col space-y-2">
              <h1 className={`text-xl font-semibold`}>the highest phones</h1>
              <SegmentedControl
                options={['No Case 🤙', 'Case 👼']}
                onChange={(i) => {
                  const options = ['no-case', 'case'] as const;
                  setMode(options[i]);
                }}
                selectedIndex={mode === 'no-case' ? 0 : 1}
              />
              <SegmentedControl
                options={['Today ⏳', 'All Time 🌎']}
                onChange={(i) => {
                  const options = ['daily', 'all-time'] as const;
                  setTimeWindow(options[i]);
                }}
                selectedIndex={timeWindow === 'daily' ? 0 : 1}
              />
            </div>
            <div className="w-[60px]">&nbsp;</div>
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
