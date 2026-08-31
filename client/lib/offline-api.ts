'use client';

import { apiService } from './api';
import { useOffline } from '@/hooks/use-offline';
import { getErrorMessage, getErrorStatus } from './error-utils';
import type { Order } from './types';

interface OfflineApiOptions {
  endpoint: string;
  data: Record<string, unknown>;
  method: 'POST' | 'PUT' | 'DELETE';
  type: 'harvest' | 'shipment' | 'listing' | 'order';
  action: 'create' | 'update' | 'delete';
}

class OfflineApiService {
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldQueueForRetry(error: unknown): boolean {
    const status = getErrorStatus(error);
    if (typeof status === 'number') {
      // Client/validation errors should surface to the user, not be queued.
      if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false;
      }
      if (status >= 500 || status === 408 || status === 429) {
        return true;
      }
    }

    const message = getErrorMessage(error, '');
    return (
      error instanceof TypeError ||
      message.includes('Network error') ||
      message.includes('Unable to connect') ||
      message.includes('Request timeout')
    );
  }

  private queueAction(
    offlineHook: ReturnType<typeof useOffline>,
    type: OfflineApiOptions['type'],
    data: Record<string, unknown>,
    action: OfflineApiOptions['action']
  ) {
    const offlineAction = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      action,
    };
    offlineHook.addOfflineAction(offlineAction);
    return offlineAction;
  }

  async makeRequest(options: OfflineApiOptions, offlineHook: ReturnType<typeof useOffline>) {
    const { endpoint, data, method, type, action } = options;
    
    // If offline, queue the action
    if (offlineHook.isOffline) {
      const offlineAction = this.queueAction(offlineHook, type, data, action);
      
      return {
        success: true,
        queued: true,
        message: `${type} ${action} queued for sync when online`,
        offlineAction
      };
    }
    
    // If online, make the actual API call
    try {
      let response;
      switch (method) {
        case 'POST':
          response = await apiService.post(endpoint, data);
          break;
        case 'PUT':
          response = await apiService.put(endpoint, data);
          break;
        case 'DELETE':
          response = await apiService.delete(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      return {
        success: true,
        queued: false,
        data: response,
        message: `${type} ${action} completed successfully`
      };
    } catch (error: unknown) {
      const message = getErrorMessage(error, `${type} ${action} failed`);
      if (!this.shouldQueueForRetry(error)) {
        return {
          success: false,
          queued: false,
          error: message,
          message,
        };
      }

      const offlineAction = this.queueAction(offlineHook, type, data, action);
      
      return {
        success: false,
        queued: true,
        error: message,
        message: `Connection issue detected, ${type} ${action} queued for retry`,
        offlineAction
      };
    }
  }

  // Convenience methods for common operations
  async createHarvest(data: Record<string, unknown>, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: '/harvests',
      data,
      method: 'POST',
      type: 'harvest',
      action: 'create'
    }, offlineHook);
  }

  async updateHarvest(harvestId: string, data: Record<string, unknown>, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: `/harvests/${harvestId}`,
      data,
      method: 'PUT',
      type: 'harvest',
      action: 'update'
    }, offlineHook);
  }

  async createShipment(data: Record<string, unknown>, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: '/shipments',
      data,
      method: 'POST',
      type: 'shipment',
      action: 'create'
    }, offlineHook);
  }

  async updateShipment(shipmentId: string, data: Record<string, unknown>, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: `/shipments/${shipmentId}`,
      data,
      method: 'PUT',
      type: 'shipment',
      action: 'update'
    }, offlineHook);
  }

  async createListing(data: Record<string, unknown>, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: '/marketplace/listings',
      data,
      method: 'POST',
      type: 'listing',
      action: 'create'
    }, offlineHook);
  }

  async updateListing(listingId: string, data: Record<string, unknown>, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: `/marketplace/listings/${listingId}`,
      data,
      method: 'PUT',
      type: 'listing',
      action: 'update'
    }, offlineHook);
  }

  async createOrder(data: object & { idempotencyKey?: string }, offlineHook: ReturnType<typeof useOffline>) {
    const { idempotencyKey: incomingKey, ...payload } = (data || {}) as Record<string, unknown> & { idempotencyKey?: unknown }
    let idempotencyKey = incomingKey

    if (!idempotencyKey && typeof crypto !== 'undefined' && crypto.randomUUID) {
      idempotencyKey = crypto.randomUUID()
    }

    const queuedPayload: Record<string, unknown> = { ...payload, idempotencyKey }

    if (offlineHook.isOffline) {
      const offlineAction = {
        id: this.generateId(),
        type: 'order' as const,
        data: queuedPayload,
        timestamp: Date.now(),
        action: 'create' as const
      }
      offlineHook.addOfflineAction(offlineAction)
      return {
        success: true,
        queued: true,
        message: 'order create queued for sync when online',
        offlineAction
      }
    }

    try {
      const response = await apiService.createOrder(
        payload as unknown as Partial<Order>,
        idempotencyKey ? { idempotencyKey: String(idempotencyKey) } : undefined
      )
      return {
        success: true,
        queued: false,
        data: response.data,
        message: 'order create completed successfully'
      }
    } catch (error: unknown) {
      const status = getErrorStatus(error)
      const message = getErrorMessage(error, 'order create rejected')
      // Do not queue client validation errors — they will never succeed on retry
      if (typeof status === 'number' && status >= 400 && status < 500) {
        return {
          success: false,
          queued: false,
          error: message,
          message: message || 'order create rejected',
        }
      }

      const offlineAction = {
        id: this.generateId(),
        type: 'order' as const,
        data: queuedPayload,
        timestamp: Date.now(),
        action: 'create' as const
      }
      offlineHook.addOfflineAction(offlineAction)
      return {
        success: false,
        queued: true,
        error: message,
        message: 'order create failed, queued for retry'
      }
    }
  }

  async updateOrder(orderId: string, data: Record<string, unknown>, offlineHook: ReturnType<typeof useOffline>) {
    return this.makeRequest({
      endpoint: `/marketplace/orders/${orderId}`,
      data,
      method: 'PUT',
      type: 'order',
      action: 'update'
    }, offlineHook);
  }
}

export const offlineApiService = new OfflineApiService();
export default offlineApiService;
