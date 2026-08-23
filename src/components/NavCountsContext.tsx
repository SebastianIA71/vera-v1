'use client';

import { createContext, useContext } from 'react';

type NavCounts = { tasksCount: number; urgentTasksCount: number; inboxCount: number };

export const NavCountsContext = createContext<NavCounts>({ tasksCount: 0, urgentTasksCount: 0, inboxCount: 0 });

export function NavCountsProvider({ tasksCount, urgentTasksCount, inboxCount, children }: NavCounts & { children: React.ReactNode }) {
  return (
    <NavCountsContext.Provider value={{ tasksCount, urgentTasksCount, inboxCount }}>
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts() {
  return useContext(NavCountsContext);
}
