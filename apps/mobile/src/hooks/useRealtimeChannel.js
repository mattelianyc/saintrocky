import { useCallback, useEffect, useRef, useState } from 'react';
import { getMobileRealtimeClient } from '@/realtime/client.js';

export function useRealtimeChannel(channel, { onSnapshot, onEvent } = {}) {
  const [data, setData] = useState(null);
  const onSnapshotRef = useRef(onSnapshot);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onSnapshotRef.current = onSnapshot;
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    if (!channel) return;

    const client = getMobileRealtimeClient();
    const unsubscribe = client.subscribe(channel, (message) => {
      const payload = message?.payload ?? null;
      if (message.type === 'channel.snapshot') {
        setData(payload);
        onSnapshotRef.current?.(payload, message);
      }
      if (message.type === 'channel.event') {
        onEventRef.current?.(payload, message);
      }
    });

    return unsubscribe;
  }, [channel]);

  const refresh = useCallback(() => {
    setData(null);
  }, []);

  return { data, refresh };
}
