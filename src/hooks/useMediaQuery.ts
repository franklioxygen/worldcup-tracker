import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);

  useEffect(() => {
    const media = matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', handler);
    setMatches(media.matches);
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
