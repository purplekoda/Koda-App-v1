'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook for settings sub-pages. Handles save → toast → navigate back.
 */
export function useSettingsSave() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const save = useCallback(
    (action) => {
      startTransition(async () => {
        setError(null);
        const result = await action();
        if (result?.success === false) {
          setError(result.error);
        } else {
          setToast('Saved');
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            router.push('/settings');
          }, 1500);
        }
      });
    },
    [router],
  );

  const goBack = useCallback(() => {
    router.push('/settings');
  }, [router]);

  return { save, isPending, error, toast, goBack };
}
