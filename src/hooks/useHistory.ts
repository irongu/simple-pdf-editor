import { useState, useCallback, useRef } from 'react';

export type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

const MAX_HISTORY = 50;

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });
  const presentRef = useRef(initialState);

  const push = useCallback((state: T) => {
    setHistory((prev) => {
      const newPast = [...prev.past, prev.present];
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }
      return {
        past: newPast,
        present: state,
        future: [],
      };
    });
    presentRef.current = state;
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      presentRef.current = previous;
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      presentRef.current = next;
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newInitialState: T) => {
    setHistory({
      past: [],
      present: newInitialState,
      future: [],
    });
    presentRef.current = newInitialState;
  }, []);

  const setState = useCallback((state: T) => {
    setHistory((prev) => ({
      ...prev,
      present: state,
    }));
    presentRef.current = state;
  }, []);

  const getState = useCallback(() => {
    return presentRef.current;
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    setState,
    getState,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}
