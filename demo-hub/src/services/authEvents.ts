import { supabase } from '@/integrations/supabase/client';

export type AuthEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'security_challenge_success'
  | 'security_challenge_failure'
  | 'account_locked';

export interface AuthEvent {
  id: string;
  user_id: string | null;
  email: string;
  event_type: AuthEventType;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

/**
 * Log an auth event. Works for both authenticated and anonymous contexts.
 * For anonymous events (login_failure), user_id should be null.
 */
export async function logAuthEvent(
  event_type: AuthEventType,
  email: string,
  userId?: string | null,
  metadata?: Record<string, any>
) {
  try {
    const userAgent = navigator.userAgent;
    
    await supabase.from('auth_events' as any).insert({
      user_id: userId || null,
      email: email.toLowerCase(),
      event_type,
      user_agent: userAgent,
      metadata: metadata || {},
    } as any);
  } catch (e) {
    // Non-fatal — don't break auth flows for logging failures
    console.warn('Failed to log auth event:', e);
  }
}

/**
 * Fetch auth events for admin display with pagination.
 */
export async function fetchAuthEvents(options?: {
  limit?: number;
  offset?: number;
  eventType?: AuthEventType;
  email?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: AuthEvent[]; count: number }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let query = supabase
    .from('auth_events' as any)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }
  if (options?.email) {
    query = query.ilike('email', `%${options.email}%`);
  }
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data || []) as unknown as AuthEvent[], count: count || 0 };
}
