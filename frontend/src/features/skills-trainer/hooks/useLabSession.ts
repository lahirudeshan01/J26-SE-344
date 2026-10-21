import { useCallback, useMemo, useState } from 'react';
import { labEventBus, type LabActionEvent, type LabActionType } from '../services/labEventBus';

export function useLabSession(labId: string) {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const [events, setEvents] = useState<LabActionEvent[]>([]);

  const emit = useCallback(
    (type: LabActionType, payload: Record<string, unknown> = {}) => {
      const event: LabActionEvent = {
        id: crypto.randomUUID(),
        sessionId,
        labId,
        type,
        payload,
        at: new Date().toISOString()
      };
      setEvents((prev) => [...prev, event]);
      labEventBus.emit(event);
    },
    [sessionId, labId]
  );

  return { sessionId, events, emit };
}
