import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import logger from '@/utils/logger';

interface QueuedMutation {
  id: string;
  timestamp: number;
  operation: string;
  data: any;
  retryCount: number;
}

const STORAGE_KEY = 'offline_mutation_queue';
const MAX_RETRIES = 3;

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedMutation[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Load queue from localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem(STORAGE_KEY);
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (error) {
        logger.error('Error loading offline queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing changes...');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline - changes will sync when reconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add mutation to queue
  const queueMutation = useCallback((operation: string, data: any) => {
    const mutation: QueuedMutation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      operation,
      data,
      retryCount: 0,
    };

    setQueue(prev => [...prev, mutation]);
    
    if (!isOnline) {
      toast.info('Saved offline - will sync when online');
    }
  }, [isOnline]);

  // Process queue when online
  const syncQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0 || syncing) return;

    setSyncing(true);
    const successfulMutations: string[] = [];
    const failedMutations: QueuedMutation[] = [];

    for (const mutation of queue) {
      try {
        // Execute the mutation
        // This would need to be customized based on your actual API calls
        logger.debug(`Syncing: ${mutation.operation}`, mutation.data);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        successfulMutations.push(mutation.id);
      } catch (error) {
        logger.error(`Failed to sync mutation ${mutation.id}:`, error);
        
        if (mutation.retryCount < MAX_RETRIES) {
          failedMutations.push({
            ...mutation,
            retryCount: mutation.retryCount + 1,
          });
        }
      }
    }

    // Update queue
    setQueue(failedMutations);
    setSyncing(false);

    if (successfulMutations.length > 0) {
      toast.success(`Synced ${successfulMutations.length} changes`);
    }

    if (failedMutations.length > 0) {
      toast.error(`${failedMutations.length} changes failed to sync`);
    }
  }, [isOnline, queue, syncing]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue();
    }
  }, [isOnline, queue.length, syncQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Offline queue cleared');
  }, []);

  return {
    isOnline,
    queue,
    queueLength: queue.length,
    syncing,
    queueMutation,
    syncQueue,
    clearQueue,
  };
}
