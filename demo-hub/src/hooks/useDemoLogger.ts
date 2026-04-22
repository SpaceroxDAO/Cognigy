import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFlows } from '@/contexts/FlowContext';

export const useDemoLogger = (botName: string) => {
  const { user } = useAuth();
  const { flows } = useFlows();
  const logIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const startLog = useCallback(async () => {
    if (!user?.id) return;
    const flow = flows.find(f => f.name === botName);
    if (!flow) return;

    const startedAt = new Date();
    startTimeRef.current = startedAt;

    try {
      const { data, error } = await supabase.from('demo_logs').insert({
        user_id: user.id,
        flow_id: flow.id,
        flow_name: flow.name,
        started_at: startedAt.toISOString(),
      }).select('id').single();

      if (!error && data) {
        logIdRef.current = data.id;
      }
    } catch (e) {
      console.warn('Failed to log demo start:', e);
    }
  }, [user?.id, botName, flows]);

  const endLog = useCallback(async () => {
    if (!logIdRef.current || !startTimeRef.current) return;

    const endedAt = new Date();
    const durationSeconds = Math.round((endedAt.getTime() - startTimeRef.current.getTime()) / 1000);

    try {
      await supabase.from('demo_logs').update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      }).eq('id', logIdRef.current);
    } catch (e) {
      console.warn('Failed to log demo end:', e);
    }

    logIdRef.current = null;
    startTimeRef.current = null;
  }, []);

  return { startLog, endLog };
};
