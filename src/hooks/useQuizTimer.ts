import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseQuizTimerProps {
  attemptId: string | null;
  timeLimitMinutes: number | null;
  onTimeExpired: () => void;
  enabled: boolean;
}

interface TimerState {
  timeRemaining: number; // in seconds
  isActive: boolean;
  hasStarted: boolean;
  isExpired: boolean;
}

const STORAGE_PREFIX = 'quiz_timer_';
const SYNC_INTERVAL = 10000; // Sync with server every 10 seconds

export const useQuizTimer = ({
  attemptId,
  timeLimitMinutes,
  onTimeExpired,
  enabled
}: UseQuizTimerProps) => {
  const [timerState, setTimerState] = useState<TimerState>({
    timeRemaining: 0,
    isActive: false,
    hasStarted: false,
    isExpired: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasExpiredRef = useRef(false);

  // Get storage key
  const getStorageKey = useCallback(() => {
    return attemptId ? `${STORAGE_PREFIX}${attemptId}` : null;
  }, [attemptId]);

  // Load timer state from localStorage and server
  const loadTimerState = useCallback(async () => {
    if (!attemptId || !timeLimitMinutes || !enabled) return;

    try {
      // First, check server state
      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .select('timer_started_at, time_limit_minutes, time_remaining_seconds, is_timer_active, completed_at')
        .eq('id', attemptId)
        .single();

      if (error) throw error;

      // If quiz is already completed, don't start timer
      if (attempt.completed_at) {
        setTimerState({
          timeRemaining: 0,
          isActive: false,
          hasStarted: true,
          isExpired: true
        });
        return;
      }

      // If timer was started on server
      if (attempt.timer_started_at && attempt.is_timer_active) {
        const startedAt = new Date(attempt.timer_started_at).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        const totalSeconds = (attempt.time_limit_minutes || timeLimitMinutes) * 60;
        const remaining = Math.max(0, totalSeconds - elapsedSeconds);

        if (remaining <= 0) {
          // Timer has expired
          setTimerState({
            timeRemaining: 0,
            isActive: false,
            hasStarted: true,
            isExpired: true
          });
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onTimeExpired();
          }
        } else {
          // Timer is still running
          setTimerState({
            timeRemaining: remaining,
            isActive: true,
            hasStarted: true,
            isExpired: false
          });

          // Update localStorage
          const storageKey = getStorageKey();
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify({
              timeRemaining: remaining,
              lastUpdated: now,
              attemptId
            }));
          }
        }
      } else {
        // Timer not started yet - check localStorage for any cached state
        const storageKey = getStorageKey();
        if (storageKey) {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed.attemptId === attemptId) {
                const cachedTime = parsed.lastUpdated || 0;
                const elapsedSinceCached = Math.floor((Date.now() - cachedTime) / 1000);
                const remaining = Math.max(0, parsed.timeRemaining - elapsedSinceCached);

                if (remaining > 0) {
                  setTimerState({
                    timeRemaining: remaining,
                    isActive: false,
                    hasStarted: false,
                    isExpired: false
                  });
                  return;
                }
              }
            } catch (e) {
              console.error('Error parsing cached timer:', e);
            }
          }
        }

        // No cached state - initialize fresh
        setTimerState({
          timeRemaining: timeLimitMinutes * 60,
          isActive: false,
          hasStarted: false,
          isExpired: false
        });
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
      toast.error('Failed to load timer state');
    }
  }, [attemptId, timeLimitMinutes, enabled, getStorageKey, onTimeExpired]);

  // Start the timer
  const startTimer = useCallback(async () => {
    if (!attemptId || !timeLimitMinutes || timerState.hasStarted) return;

    try {
      // Call RPC to start timer on server
      const { data, error } = await supabase.rpc('start_quiz_timer', {
        p_attempt_id: attemptId,
        p_time_limit_minutes: timeLimitMinutes
      });

      if (error) throw error;

      setTimerState(prev => ({
        ...prev,
        timeRemaining: timeLimitMinutes * 60,
        isActive: true,
        hasStarted: true,
        isExpired: false
      }));

      toast.success('Timer started!');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  }, [attemptId, timeLimitMinutes, timerState.hasStarted]);

  // Sync timer to server
  const syncTimerToServer = useCallback(async () => {
    if (!attemptId || !timerState.isActive) return;

    try {
      await supabase.rpc('update_quiz_timer', {
        p_attempt_id: attemptId,
        p_time_remaining_seconds: timerState.timeRemaining
      });
    } catch (error) {
      console.error('Error syncing timer:', error);
    }
  }, [attemptId, timerState.isActive, timerState.timeRemaining]);

  // Countdown effect
  useEffect(() => {
    if (!timerState.isActive || timerState.isExpired || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimerState(prev => {
        const newRemaining = prev.timeRemaining - 1;

        // Update localStorage
        const storageKey = getStorageKey();
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify({
            timeRemaining: newRemaining,
            lastUpdated: Date.now(),
            attemptId
          }));
        }

        if (newRemaining <= 0) {
          // Timer expired
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            setTimeout(() => onTimeExpired(), 100);
          }
          return {
            ...prev,
            timeRemaining: 0,
            isActive: false,
            isExpired: true
          };
        }

        return {
          ...prev,
          timeRemaining: newRemaining
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isActive, timerState.isExpired, enabled, getStorageKey, attemptId, onTimeExpired]);

  // Periodic sync to server
  useEffect(() => {
    if (!timerState.isActive || !enabled) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    syncIntervalRef.current = setInterval(syncTimerToServer, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [timerState.isActive, enabled, syncTimerToServer]);

  // Load timer state on mount
  useEffect(() => {
    loadTimerState();
  }, [loadTimerState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining: timerState.timeRemaining,
    isActive: timerState.isActive,
    hasStarted: timerState.hasStarted,
    isExpired: timerState.isExpired,
    formattedTime: formatTime(timerState.timeRemaining),
    startTimer,
    refreshTimer: loadTimerState
  };
};
