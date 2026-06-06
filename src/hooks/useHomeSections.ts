'use client';

import { useState, useEffect, useCallback } from 'react';

export type SectionId = 'now' | 'done' | 'inbox' | 'weight' | 'events' | 'trips' | 'calendar' | 'realestate' | 'projects' | 'finance' | 'pick';

export const SECTION_LABELS: Record<SectionId, string> = {
  now:        'Now (urgentes)',
  done:       'Completadas hoy',
  inbox:      'Inbox',
  weight:     'Weight',
  events:     'Upcoming Events',
  trips:      'Upcoming Trips',
  calendar:   'Calendar',
  realestate: 'Real Estate',
  projects:   'Projects',
  finance:    'Finance',
  pick:       'Pick (IA)',
};

export const DEFAULT_SECTIONS: SectionId[] = [
  'now', 'done', 'inbox', 'weight', 'events', 'trips', 'calendar', 'realestate', 'projects', 'finance', 'pick',
];

const STORAGE_KEY = 'vera_home_sections';

export function useHomeSections() {
  const [visible, setVisible] = useState<SectionId[]>(DEFAULT_SECTIONS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SectionId[];
        if (Array.isArray(parsed)) setVisible(parsed);
      }
    } catch { /* keep defaults */ }
    setReady(true);
  }, []);

  const toggle = useCallback((id: SectionId) => {
    setVisible(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isVisible = useCallback((id: SectionId) => visible.includes(id), [visible]);

  return { visible, toggle, isVisible, ready };
}
