import { useCallback, useState } from 'react';

export function useRefreshControl(loadFunction) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFunction();
    } catch {}
    setRefreshing(false);
  }, [loadFunction]);

  return { refreshing, onRefresh };
}
