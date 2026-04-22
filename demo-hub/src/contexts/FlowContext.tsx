import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type FlowConfig = Database['public']['Tables']['flows']['Row'];

interface FlowContextType {
  flows: FlowConfig[];
  loading: boolean;
  error: string | null;
  refreshFlows: () => Promise<void>;
  getFlowByPath: (path: string) => FlowConfig | undefined;
  getFlowById: (id: string) => FlowConfig | undefined;
  getVisibleFlows: () => FlowConfig[];
  getEnabledFlows: () => FlowConfig[];
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const FlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flows, setFlows] = useState<FlowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('flows')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setFlows(data || []);
    } catch (err: any) {
      console.error('Error fetching flows:', err);
      setError(err.message || 'Failed to load flows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const refreshFlows = async () => fetchFlows();
  const getFlowByPath = (path: string) => flows.find((f) => f.path === path);
  const getFlowById = (id: string) => flows.find((f) => f.id === id);
  const getVisibleFlows = () => flows.filter((f) => f.enabled || f.coming_soon);
  const getEnabledFlows = () => flows.filter((f) => f.enabled);

  return (
    <FlowContext.Provider value={{ flows, loading, error, refreshFlows, getFlowByPath, getFlowById, getVisibleFlows, getEnabledFlows }}>
      {children}
    </FlowContext.Provider>
  );
};

export const useFlows = () => {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlows must be used within a FlowProvider');
  return ctx;
};
