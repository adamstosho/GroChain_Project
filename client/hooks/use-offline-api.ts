'use client';

import { useOffline } from './use-offline';
import { offlineApiService } from '@/lib/offline-api';
import { toast } from 'sonner';

export function useOfflineApi() {
  const offlineHook = useOffline();

  const showOfflineMessage = (type: string, action: string) => {
    toast.success(`${type} ${action} queued`, {
      description: 'Will sync when connection is restored',
      duration: 3000,
    });
  };

  const showOnlineMessage = (type: string, action: string) => {
    toast.success(`${type} ${action} completed`, {
      description: 'Successfully saved to server',
      duration: 3000,
    });
  };

  const showErrorMessage = (type: string, action: string, error: string) => {
    toast.error(`${type} ${action} failed`, {
      description: error,
      duration: 5000,
    });
  };

  // Harvest operations
  const createHarvest = async (data: any) => {
    const result = await offlineApiService.createHarvest(data, offlineHook);
    
    if (result.queued) {
      showOfflineMessage('Harvest', 'creation');
    } else if (result.success) {
      showOnlineMessage('Harvest', 'creation');
    } else {
      showErrorMessage('Harvest', 'creation', result.error || 'Unknown error');
    }
    
    return result;
  };

  const updateHarvest = async (harvestId: string, data: any) => {
    const result = await offlineApiService.updateHarvest(harvestId, data, offlineHook);
    
    if (result.queued) {
      showOfflineMessage('Harvest', 'update');
    } else if (result.success) {
      showOnlineMessage('Harvest', 'update');
    } else {
      showErrorMessage('Harvest', 'update', result.error || 'Unknown error');
    }
    
    return result;
  };

  // Shipment operations
  const createShipment = async (data: any) => {
    const result = await offlineApiService.createShipment(data, offlineHook);
    
    if (result.queued) {
      showOfflineMessage('Shipment', 'creation');
    } else if (result.success) {
      showOnlineMessage('Shipment', 'creation');
    } else {
      showErrorMessage('Shipment', 'creation', result.error || 'Unknown error');
    }
    
    return result;
  };

  const updateShipment = async (shipmentId: string, data: any) => {
    const result = await offlineApiService.updateShipment(shipmentId, data, offlineHook);
    
    if (result.queued) {
      showOfflineMessage('Shipment', 'update');
    } else if (result.success) {
      showOnlineMessage('Shipment', 'update');
    } else {
      showErrorMessage('Shipment', 'update', result.error || 'Unknown error');
    }
    
    return result;
  };

  // Marketplace operations
  const createListing = async (data: any) => {
    const result = await offlineApiService.createListing(data, offlineHook);
    
    if (result.queued) {
      showOfflineMessage('Listing', 'creation');
    } else if (result.success) {
      showOnlineMessage('Listing', 'creation');
    } else {
      showErrorMessage('Listing', 'creation', result.error || 'Unknown error');
    }
    
    return result;
  };

  const updateListing = async (listingId: string, data: any) => {
    const result = await offlineApiService.updateListing(listingId, data, offlineHook);
    
    if (result.queued) {
      showOfflineMessage('Listing', 'update');
    } else if (result.success) {
      showOnlineMessage('Listing', 'update');
    } else {
      showErrorMessage('Listing', 'update', result.error || 'Unknown error');
    }
    
    return result;
  };

  const createOrder = async (data: any) => {
    const result = await offlineApiService.createOrder(data, offlineHook);
    
    if (result.queued) {
      showOfflineMessage('Order', 'creation');
    } else if (result.success) {
      showOnlineMessage('Order', 'creation');
    } else {
      showErrorMessage('Order', 'creation', result.error || 'Unknown error');
    }
    
    return result;
  };

  const updateOrder = async (orderId: string, data: any) => {
    const result = await offlineApiService.updateOrder(orderId, data, offlineHook);
    
    if (result.queued) {
      showOfflineMessage('Order', 'update');
    } else if (result.success) {
      showOnlineMessage('Order', 'update');
    } else {
      showErrorMessage('Order', 'update', result.error || 'Unknown error');
    }
    
    return result;
  };

  return {
    // Offline state
    isOnline: offlineHook.isOnline,
    isOffline: offlineHook.isOffline,
    pendingSync: offlineHook.pendingSync,
    
    // Operations
    createHarvest,
    updateHarvest,
    createShipment,
    updateShipment,
    createListing,
    updateListing,
    createOrder,
    updateOrder,
    
    // Sync operations
    syncPendingActions: offlineHook.syncPendingActions,
    clearPendingActions: offlineHook.clearPendingActions,
  };
}
