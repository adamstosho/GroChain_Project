/**
 * Real-time Commission Updates Hook
 * 
 * This hook handles real-time commission updates via Socket.IO
 * and automatically refreshes the partner dashboard when new
 * commissions are earned.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { apiService } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface CommissionUpdate {
  type: 'commission_earned' | 'commission_verified';
  amount: number;
  orderId: string;
  farmerName: string;
  productName: string;
  buyerName?: string;
  totals: {
    total: number;
    pending: number;
    paid: number;
    thisMonth: number;
  };
  timestamp: Date;
}

interface UseCommissionUpdatesOptions {
  autoRefresh?: boolean;
  onCommissionUpdate?: (update: CommissionUpdate) => void;
  onError?: (error: Error) => void;
}

export function useCommissionUpdates(options: UseCommissionUpdatesOptions = {}) {
  const { autoRefresh = true, onCommissionUpdate, onError } = options;
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<CommissionUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to store stable references to callbacks and socket
  const onCommissionUpdateRef = useRef(onCommissionUpdate);
  const onErrorRef = useRef(onError);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Update refs when callbacks change
  useEffect(() => {
    onCommissionUpdateRef.current = onCommissionUpdate;
  }, [onCommissionUpdate]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Connect to Socket.IO for real-time updates
  const connectSocket = useCallback(() => {
    if (!user || user.role !== 'partner') {
      console.log('🔌 Skipping Socket.IO connection: User is not a partner');
      return;
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Get auth token from auth store
      if (!token) {
        console.error('🔌 No auth token found for Socket.IO connection');
        setError('No authentication token');
        return;
      }

      // Close existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Create Socket.IO connection
      const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
      console.log('🔌 Connecting to Socket.IO:', socketUrl);
      
      const socketInstance = io(socketUrl, {
        path: '/notifications',
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      socketInstance.on('connect', () => {
        console.log('🔌 Socket.IO connected successfully');
        setIsConnected(true);
        setError(null);
        
        // Join partner role room
        socketInstance.emit('join-role-room', { role: 'partner' });
      });

      socketInstance.on('commission_update', (data) => {
        try {
          console.log('🔌 Commission update received:', data);

          const update: CommissionUpdate = {
            type: data.type,
            amount: data.amount,
            orderId: data.orderId,
            farmerName: data.farmerName,
            productName: data.productName,
            buyerName: data.buyerName,
            totals: data.totals,
            timestamp: new Date(data.timestamp)
          };

          console.log('💰 Commission update processed:', update);
          setLastUpdate(update);
          
          if (onCommissionUpdateRef.current) {
            onCommissionUpdateRef.current(update);
          }

          // Show success notification
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('commission-earned', {
              detail: {
                amount: update.amount,
                farmerName: update.farmerName,
                productName: update.productName
              }
            }));
          }
        } catch (error) {
          console.error('🔌 Error processing commission update:', error);
          if (onErrorRef.current) {
            onErrorRef.current(error as Error);
          }
        }
      });

      socketInstance.on('notification', (data) => {
        console.log('📨 Notification received:', data);
        
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('new-notification', {
            detail: data
          }));
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('🔌 Socket.IO connection error:', error);
        setError('Socket.IO connection error');
        setIsConnected(false);
        if (onErrorRef.current) {
          onErrorRef.current(new Error('Socket.IO connection error'));
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected:', reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds if autoRefresh is enabled
        if (autoRefresh && user && user.role === 'partner' && reason !== 'io client disconnect') {
          console.log('🔌 Attempting to reconnect in 5 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
          }, 5000);
        }
      });

      setSocket(socketInstance);
      socketRef.current = socketInstance;

    } catch (error) {
      console.error('🔌 Error creating Socket.IO connection:', error);
      setError('Failed to create Socket.IO connection');
      if (onErrorRef.current) {
        onErrorRef.current(error as Error);
      }
    }
  }, [user, token, autoRefresh]);

  // Disconnect Socket.IO
  const disconnectSocket = useCallback(() => {
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      console.log('🔌 Disconnecting Socket.IO');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Connect on mount and when user changes
  useEffect(() => {
    if (user && user.role === 'partner' && token) {
      connectSocket();
    }

    return () => {
      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Disconnect socket if it exists
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.role, token]); // Only depend on role and token, not the callbacks

  return {
    isConnected,
    lastUpdate,
    error,
    reconnect: connectSocket,
    disconnect: disconnectSocket
  };
}

export default useCommissionUpdates;
