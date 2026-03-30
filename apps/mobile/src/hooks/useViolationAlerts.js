import { useCallback, useEffect, useState } from 'react';
import { buildRulesChannel, buildRuntimeChannel } from '@saintrocky/realtime';
import { api } from '@saintrocky/api-client';
import { useRealtimeChannel } from './useRealtimeChannel.js';

export function useViolationAlerts(ownerEmail) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);

  const rulesChannel = ownerEmail ? buildRulesChannel(ownerEmail) : null;
  const runtimeChannel = ownerEmail
    ? buildRuntimeChannel(ownerEmail, 'mobile_observer')
    : null;

  useRealtimeChannel(rulesChannel, {
    onEvent(message) {
      const event = message?.data;
      if (event?.eventType === 'rule_triggered' || event?.eventType === 'bypass_offered') {
        setViolations((prev) => {
          const exists = prev.some((v) => v.ruleId === event.ruleId);
          if (exists) return prev;
          return [event, ...prev];
        });
      }
      if (event?.eventType === 'rule_complied' || event?.eventType === 'bypass_confirmed') {
        setViolations((prev) => prev.filter((v) => v.ruleId !== event.ruleId));
      }
    }
  });

  useRealtimeChannel(runtimeChannel);

  const comply = useCallback(async (violation) => {
    setLoading(true);
    try {
      await api.rules.reportRuntimeEvent({
        runtimeSurface: violation.surface || 'mobile_observer',
        eventType: 'rule_complied',
        ruleId: violation.ruleId,
        ownerEmail
      });
      setViolations((prev) => prev.filter((v) => v.ruleId !== violation.ruleId));
    } finally {
      setLoading(false);
    }
  }, [ownerEmail]);

  const bypass = useCallback(async (violation) => {
    setLoading(true);
    try {
      await api.rules.requestOverride(violation.ruleId, {
        surface: violation.surface || 'mobile_observer'
      });
      setViolations((prev) => prev.filter((v) => v.ruleId !== violation.ruleId));
    } finally {
      setLoading(false);
    }
  }, []);

  const dismiss = useCallback((ruleId) => {
    setViolations((prev) => prev.filter((v) => v.ruleId !== ruleId));
  }, []);

  return { violations, loading, comply, bypass, dismiss };
}
