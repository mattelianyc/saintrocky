"use client";

import { useEffect, useRef, useState } from "react";
import { buildLeaderboardChannel, createRealtimeClient } from "@saintrocky/realtime";

export function useLeaderboardStream(initialEntries = []) {
  const [entries, setEntries] = useState(initialEntries);
  const [connectionState, setConnectionState] = useState("idle");
  const clientRef = useRef(null);

  useEffect(() => {
    const client = createRealtimeClient({ skipAuthentication: true });
    clientRef.current = client;

    client.onConnectionStateChange((connection) => {
      setConnectionState(connection.state);
    });

    const unsubscribe = client.subscribe(buildLeaderboardChannel(), (message) => {
      if (message.type === "channel.snapshot" && Array.isArray(message.payload?.leaderboard)) {
        setEntries(message.payload.leaderboard);
      }
    });

    client.connect();

    return () => {
      unsubscribe();
      client.disconnect();
      clientRef.current = null;
    };
  }, []);

  return { entries, connectionState };
}
