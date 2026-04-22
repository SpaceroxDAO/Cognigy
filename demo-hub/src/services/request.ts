import { supabase } from '@/integrations/supabase/client';

export interface AccessRequest {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_type: 'SE' | 'AE' | 'Partner' | 'Other';
}

export const requestService = {
  async getPendingRequests(): Promise<AccessRequest[]> {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as AccessRequest[];
  },

  async submitRequest(email: string, userType: 'SE' | 'AE' | 'Partner' | 'Other' = 'Other'): Promise<void> {
    const { error } = await supabase.from('access_requests').insert({ email, user_type: userType });
    if (error) throw error;
  },

  async approveRequest(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq('id', id);
    if (error) throw error;
  },

  async declineRequest(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'declined', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq('id', id);
    if (error) throw error;
  },
};
