import { useState, useEffect } from 'react';

export type PlayerInfo = {
  name: string;
  hasCase: boolean;
  playerId: string;
};

export const usePlayerInfo = () => {
  // a react hook to retrieve the player's name and case status from local storage and also set it
  const [playerInfo, setPlayerInfoInner] = useState<
    PlayerInfo | null | undefined
  >(undefined);
  const updateLocalStorage = ({ name, hasCase, playerId }: PlayerInfo) => {
    localStorage.setItem('airtimeName', name);
    localStorage.setItem('airtimeHasCase', hasCase ? 'true' : 'false');
    localStorage.setItem('airtimePlayerId', playerId);
  };
  const setPlayerInfo = (info: PlayerInfo) => {
    updateLocalStorage(info);
    setPlayerInfoInner(info);
  };
  useEffect(() => {
    const name = localStorage.getItem('airtimeName');
    const hasCase = localStorage.getItem('airtimeHasCase');
    const playerId = localStorage.getItem('airtimePlayerId');
    if (name || hasCase) {
      setPlayerInfoInner({
        name: name ?? '',
        hasCase: hasCase === 'true',
        playerId: playerId ?? '',
      });
    } else {
      setPlayerInfoInner(null);
    }
  }, []);
  return [playerInfo, setPlayerInfo, updateLocalStorage] as const;
};
