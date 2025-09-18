'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  id: string;
  type: 'harvest' | 'shipment' | 'listing' | 'order';
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
}

interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  pendingSync: OfflineData[];
  addOfflineAction: (data: OfflineData) => void;
  syncPendingActions: () => Promise<void>;
  clearPendingActions: () => void;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending actions from localStorage
    const savedPendingActions = localStorage.getItem('grochain-offline-actions');
    if (savedPendingActions) {
      try {
        setPendingSync(JSON.parse(savedPendingActions));
      } catch (error) {
        console.error('Failed to parse offline actions:', error);
        localStorage.removeItem('grochain-offline-actions');
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save pending actions to localStorage whenever it changes
  useEffect(() => {
    if (pendingSync.length > 0) {
      localStorage.setItem('grochain-offline-actions', JSON.stringify(pendingSync));
    } else {
      localStorage.removeItem('grochain-offline-actions');
    }
  }, [pendingSync]);

  const addOfflineAction = useCallback((data: OfflineData) => {
    setPendingSync(prev => [...prev, data]);
  }, []);

  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingSync.length === 0) return;

    const { apiService } = await import('@/lib/api');
    const syncPromises = pendingSync.map(async (action) => {
      try {
        switch (action.type) {
          case 'harvest':
            if (action.action === 'create') {
              await apiService.post('/harvests', action.data);
            } else if (action.action === 'update') {
              await apiService.put(`/harvests/${action.data.id}`, action.data);
            }
            break;
          case 'shipment':
            if (action.action === 'create') {
              await apiService.post('/shipments', action.data);
            } else if (action.action === 'update') {
              await apiService.put(`/shipments/${action.data.id}`, action.data);
            }
            break;
          case 'listing':
            if (action.action === 'create') {
              await apiService.post('/marketplace/listings', action.data);
            } else if (action.action === 'update') {
              await apiService.put(`/marketplace/listings/${action.data.id}`, action.data);
            }
            break;
          case 'order':
            if (action.action === 'create') {
              await apiService.post('/marketplace/orders', action.data);
            } else if (action.action === 'update') {
              await apiService.put(`/marketplace/orders/${action.data.id}`, action.data);
            }
            break;
        }
        return action.id;
      } catch (error) {
        console.error(`Failed to sync ${action.type} action:`, error);
        return null;
      }
    });

    const results = await Promise.all(syncPromises);
    const successfulIds = results.filter(id => id !== null);
    
    if (successfulIds.length > 0) {
      setPendingSync(prev => prev.filter(action => !successfulIds.includes(action.id)));
    }
  }, [isOnline, pendingSync]);

  const clearPendingActions = useCallback(() => {
    setPendingSync([]);
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    pendingSync,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
  };
}



