type IconName = 'today' | 'library' | 'plan' | 'progress' | 'settings' | 'compass' | 'account' | 'tutor' | 'search' | 'bookmark' | 'check' | 'clock' | 'quiz'

const paths: Record<IconName, string> = {
  tutor: 'M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4ZM20 3v4M18 5h4',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  bookmark: 'M6 3h12v18l-6-4-6 4Z',
  check: 'm5 12 4 4L19 6',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  quiz: 'M8 3h8v4H8ZM8 5H5v16h14V5h-3M8 12h8M8 16h5',
  account: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  today: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  library: 'M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v16h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4ZM12 5v16',
  plan: 'M7 3v4M17 3v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1M8 14h2M14 14h2M8 17h2',
  progress: 'M4 4v16h16M8 15l4-5 4 2 4-6',
  settings: 'M4 7h16M4 17h16M9 4v6M15 14v6',
  compass: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5Z',
}

export default function Icon({ name }: { name: IconName }) {
  return <svg className="lp-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
