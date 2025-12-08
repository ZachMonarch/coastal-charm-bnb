import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface AutosaveOptions {
  key: string;
  data: any;
  delay?: number;
  onSave?: (data: any) => void | Promise<void>;
  enabled?: boolean;
}

export function useAutosave({
  key,
  data,
  delay = 2000,
  onSave,
  enabled = true,
}: AutosaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>(JSON.stringify(data));

  const save = useCallback(async () => {
    try {
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(data));
      
      // Call custom save handler if provided
      if (onSave) {
        await onSave(data);
      }
      
      console.log(`Autosaved: ${key}`);
    } catch (error) {
      console.error('Autosave error:', error);
      toast.error('Failed to autosave');
    }
  }, [key, data, onSave]);

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    
    // Only save if data actually changed
    if (currentData === previousDataRef.current) {
      return;
    }

    previousDataRef.current = currentData;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, save, enabled]);

  const loadSaved = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading saved data:', error);
      return null;
    }
  }, [key]);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
      console.log(`Cleared autosave: ${key}`);
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  }, [key]);

  return {
    loadSaved,
    clearSaved,
    saveNow: save,
  };
}
