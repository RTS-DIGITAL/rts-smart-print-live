import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';

export function useLiveData<T>(load: () => Promise<T>, refreshMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    load()
      .then((next) => {
        setData(next);
        setError(null);
      })
      .catch((caught: unknown) => setError(getErrorMessage(caught)));
  }, [load]);

  useEffect(() => {
    refresh();
    if (refreshMs <= 0) return;
    const timer = window.setInterval(refresh, refreshMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshMs]);

  return { data, error, refresh };
}
