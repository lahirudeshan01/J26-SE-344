export type LabActionType =
  | 'drag_start'
  | 'drop'
  | 'nudge'
  | 'read'
  | 'record'
  | 'plot'
  | 'submit_gradient'
  | 'submit_mass'
  | 'reset';

export interface LabActionEvent {
  id: string;
  sessionId: string;
  labId: string;
  type: LabActionType;
  payload: Record<string, unknown>;
  at: string;
}

type Listener = (event: LabActionEvent) => void;

// UI only reports what the student did; the assessment engine decides correctness.
export function createLabEventBus() {
  const listeners = new Set<Listener>();
  return {
    emit(event: LabActionEvent) {
      listeners.forEach((l) => l(event));
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

export const labEventBus = createLabEventBus();
