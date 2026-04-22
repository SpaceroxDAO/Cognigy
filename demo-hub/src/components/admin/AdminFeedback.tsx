import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Search, Star, MessageSquare, Clock, CheckCircle, Play } from 'lucide-react';
import { format } from 'date-fns';

type FeedbackStatus = 'pending' | 'in-progress' | 'resolved' | 'dismissed';

interface FeedbackRow {
  id: string;
  user_id: string;
  flow_id: string | null;
  rating: number | null;
  message: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
  dismissed: { label: 'Dismissed', color: 'bg-slate-100 text-slate-700' },
};

export const AdminFeedback: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setFeedback(data || []);
    } catch (e: any) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeedback(); }, []);

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    try {
      const { error } = await supabase.from('feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = feedback.filter(f => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (searchTerm && !f.message?.toLowerCase().includes(searchTerm.toLowerCase()) && !f.flow_id?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: feedback.length,
    pending: feedback.filter(f => f.status === 'pending').length,
    inProgress: feedback.filter(f => f.status === 'in-progress').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-slate-900">Feedback</h3>
        </div>
        <Button variant="outline" size="sm" onClick={loadFeedback} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: MessageSquare, color: 'text-blue-600' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
          { label: 'In Progress', value: stats.inProgress, icon: Play, color: 'text-blue-600' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
            <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search feedback..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">No feedback found</TableCell></TableRow>
              ) : filtered.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{format(new Date(f.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell><span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{f.flow_id || '—'}</span></TableCell>
                  <TableCell>
                    {f.rating != null ? (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: f.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                        <span className="text-xs text-slate-500 ml-1">{f.rating}/5</span>
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="max-w-xs"><p className="text-sm text-slate-700 truncate">{f.message || '—'}</p></TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_CONFIG[f.status]?.color}`}>
                      {STATUS_CONFIG[f.status]?.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select value={f.status} onValueChange={v => updateStatus(f.id, v as FeedbackStatus)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
