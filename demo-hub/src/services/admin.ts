import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  role: string;
  roles: string[];
  userType: string;
  lastLogin?: string;
  forcePasswordReset?: boolean;
}

export interface FlowConfig {
  id: string;
  name: string;
  path: string;
  description: string;
  enabled: boolean;
  coming_soon: boolean;
  webrtc_url: string | null;
  icon: string;
  color: string;
  gradient: string;
  avatar: string | null;
  fallback: string;
  sort_order: number;
  capabilities: any;
}

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

const ADMIN_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-email`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callAdminFunction(action: string, params: Record<string, any> = {}) {
  const token = await getToken();
  const response = await fetch(ADMIN_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify({ action, ...params }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const adminService = {
  async listUsers(): Promise<User[]> {
    const data = await callAdminFunction('list_users');
    return data.users;
  },

  async addUser(email: string, password: string, role: string, userType: string): Promise<void> {
    await callAdminFunction('create', { email, role, userType, displayName: email.split('@')[0] });
    // Set the provided password
    await callAdminFunction('force_reset', { email, password });
  },

  async deleteUser(email: string): Promise<void> {
    await callAdminFunction('delete_user', { email });
  },

  async updateEmail(oldEmail: string, newEmail: string): Promise<void> {
    await callAdminFunction('update_email', { oldEmail, newEmail });
  },

  async updateRole(email: string, role: string): Promise<void> {
    await callAdminFunction('update_role', { email, role });
  },

  async updateUserType(email: string, userType: string): Promise<void> {
    await callAdminFunction('update_user_type', { email, userType });
  },

  async forcePasswordReset(email: string, password: string): Promise<void> {
    await callAdminFunction('force_reset', { email, password });
  },

  async getFlows(): Promise<FlowConfig[]> {
    const { data, error } = await supabase.from('flows').select('*').order('sort_order');
    if (error) throw error;
    return data as FlowConfig[];
  },

  async updateFlow(id: string, updates: Partial<FlowConfig>): Promise<void> {
    const { error } = await supabase.from('flows').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async createFlow(flow: Partial<FlowConfig>): Promise<void> {
    const { error } = await supabase.from('flows').insert(flow as any);
    if (error) throw error;
  },

  async deleteFlow(id: string): Promise<void> {
    const { error } = await supabase.from('flows').delete().eq('id', id);
    if (error) throw error;
  },

  async setTempPasswordExpiry(email: string): Promise<void> {
    // Look up user_id by email via the admin function, then update profile
    const users = await this.listUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await callAdminFunction('update_profile_field', {
      userId: user.id,
      field: 'temp_password_expires_at',
      value: expiresAt,
    });
  },
};
