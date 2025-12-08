import { useCallback, useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';

/**
 * Custom hook for stable async functions in effects
 */
export function useStableEffect(
  effect: () => Promise<void> | void,
  deps: DependencyList = []
) {
  const isFirstRender = useRef(true);
  const cleanup = useRef<(() => void) | void>();

  useEffect(() => {
    const execute = async () => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      if (cleanup.current) {
        cleanup.current();
      }

      const result = await effect();
      if (typeof result === 'function') {
        cleanup.current = result;
      }
    };

    execute();

    return () => {
      if (cleanup.current) {
        cleanup.current();
      }
    };
  }, deps);
}

/**
 * Custom hook for memoized async callbacks
 */
export function useStableCallback<T extends (...args: never[]) => Promise<unknown>>(
  callback: T,
  deps: DependencyList = []
) {
  return useCallback(callback, deps);
}

/**
 * Custom hook for preventing state updates on unmounted components
 */
export function useSafeState<T>(initialState: T) {
  const mounted = useRef(true);
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: T) => {
    if (mounted.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState] as const;
}

/**
 * Custom hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
