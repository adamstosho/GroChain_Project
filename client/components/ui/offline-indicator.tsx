'use client';

import { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/use-offline';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function OfflineIndicator() {
  const { isOnline, isOffline, pendingSync, syncPendingActions, clearPendingActions } = useOffline();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      toast({
        title: `${pendingSync.length} actions pending sync`,
        description: 'Your offline actions will be synchronized automatically.',
        duration: 5000,
      });
    }
  }, [isOnline, pendingSync.length, toast]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingActions();
      toast({ title: 'Offline actions synchronized successfully!', variant: 'success' });
    } catch {
      toast({ title: 'Failed to sync offline actions. Please try again.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearPending = () => {
    clearPendingActions();
    toast({ title: 'Pending actions cleared' });
  };

  if (isOnline && pendingSync.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-l-4 border-l-success">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOffline ? (
                <>
                  <WifiOff className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">You're offline</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingSync.length} actions queued
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Wifi className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-success">Back online</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingSync.length} actions pending sync
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {pendingSync.length > 0 && (
                <Badge variant="secondary" className="bg-warning/15 text-warning">
                  {pendingSync.length}
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showDetails ? 'Hide' : 'Details'}
              </Button>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Pending Actions:</h4>
                {pendingSync.length === 0 ? (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-success" />
                    All actions synchronized
                  </p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {pendingSync.map((action) => (
                      <div key={action.id} className="flex items-center justify-between text-xs bg-muted p-2 rounded">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-3 w-3 text-warning" />
                          <span className="capitalize">{action.type}</span>
                          <span className="text-muted-foreground">({action.action})</span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {pendingSync.length > 0 && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing || isOffline}
                    className="flex-1"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearPending}
                    className="text-destructive hover:text-destructive"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function OfflineBanner() {
  const { isOffline, pendingSync } = useOffline();

  if (!isOffline) return null;

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            You're currently offline
          </span>
          {pendingSync.length > 0 && (
            <Badge variant="secondary" className="bg-warning/15 text-warning text-xs">
              {pendingSync.length} actions queued
            </Badge>
          )}
        </div>
        <span className="text-xs text-destructive">
          Changes will sync when connection is restored
        </span>
      </div>
    </div>
  );
}

export function OfflineToast() {
  const { isOnline, pendingSync } = useOffline();
  const { toast } = useToast();

  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      toast({
        title: 'Connection restored!',
        description: `${pendingSync.length} offline actions will be synchronized automatically.`,
        duration: 5000,
      });
    }
  }, [isOnline, pendingSync.length, toast]);

  return null;
}
