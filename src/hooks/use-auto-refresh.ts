import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  onRefresh: () => Promise<void> | void;
  initialFetch?: boolean; // Whether to fetch immediately when enabled
}

export function useAutoRefresh({
  interval = 30000, // 30 seconds default
  enabled = true,
  onRefresh,
  initialFetch = false
}: UseAutoRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisible = useRef(true);
  const userActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserActivity = useRef<number>(Date.now());

  // User activity detection
  const resetUserActivity = useCallback(() => {
    lastUserActivity.current = Date.now();
    if (autoRefreshPaused) {
      setAutoRefreshPaused(false);
    }
  }, [autoRefreshPaused]);

  const pauseAutoRefresh = useCallback(() => {
    setAutoRefreshPaused(true);
  }, []);

  // Manual refresh handler
  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // Silent refresh handler
  const silentRefresh = useCallback(async () => {
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Silent refresh failed:', error);
    }
  }, [onRefresh]);

  // Set up user activity listeners
  useEffect(() => {
    const handleUserActivity = () => {
      resetUserActivity();
      
      // Clear existing timeout
      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }
      
      // Set new timeout to resume auto-refresh after 30 seconds of inactivity
      userActivityTimeoutRef.current = setTimeout(() => {
        if (autoRefreshPaused) {
          setAutoRefreshPaused(false);
        }
      }, 30000); // 30 seconds of inactivity
    };

    // Listen for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      if (userActivityTimeoutRef.current) {
        clearTimeout(userActivityTimeoutRef.current);
      }
    };
  }, [autoRefreshPaused, resetUserActivity]);

  // Handle page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      if (isPageVisible.current && intervalRef.current && !autoRefreshPaused && enabled) {
        // Page became visible, refresh immediately if not paused
        silentRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefreshPaused, enabled, silentRefresh]);

  // Auto-refresh setup
  useEffect(() => {
    if (enabled) {
      // Initial fetch if requested
      if (initialFetch) {
        silentRefresh();
      }
      
      // Set up auto-refresh
      intervalRef.current = setInterval(() => {
        if (isPageVisible.current && !autoRefreshPaused) {
          silentRefresh();
        }
      }, interval);
    }

    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled, autoRefreshPaused, silentRefresh, initialFetch]);

  return {
    refreshing,
    autoRefreshPaused,
    lastRefresh,
    manualRefresh,
    pauseAutoRefresh,
    resetUserActivity
  };
} 