import { useCallback, useReducer } from 'react';

function historyReducer(state, action) {
  switch (action.type) {
    case 'set': {
      const nextPresent = typeof action.payload === 'function'
        ? action.payload(state.present)
        : action.payload;
      return {
        past: [...state.past, state.present],
        present: nextPresent,
        future: [],
      };
    }
    case 'reset':
      return {
        past: [],
        present: action.payload,
        future: [],
      };
    case 'undo': {
      if (!state.past.length) {
        return state;
      }
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'redo': {
      if (!state.future.length) {
        return state;
      }
      const [next, ...rest] = state.future;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
      };
    }
    default:
      return state;
  }
}

export function useUndoRedo(initialValue) {
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialValue,
    future: [],
  });

  const setState = useCallback((payload) => {
    dispatch({ type: 'set', payload });
  }, []);

  const resetState = useCallback((payload) => {
    dispatch({ type: 'reset', payload });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'undo' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'redo' });
  }, []);

  return {
    state: history.present,
    setState,
    resetState,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
  };
}
