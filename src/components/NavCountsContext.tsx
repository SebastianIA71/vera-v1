'use client';

import { createContext, useContext } from 'react';

type NavCounts = { tasksCount: number; inboxCount: number };

export const NavCountsContext = createContext<NavCounts>({ tasksCount: 0, inboxCount: 0 });

export function NavCountsProvider({ tasksCount, inboxCount, children }: NavCounts & { children: React.ReactNode }) {
  return (
    <NavCountsContext.Provider value={{ tasksCount, inboxCount }}>
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
