import { useCallback, useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDebouncedCallback = <T extends (...args: any[]) => void>(callback: T, delay: number): ((...args: Parameters<T>) => void) => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedCallback;
};
