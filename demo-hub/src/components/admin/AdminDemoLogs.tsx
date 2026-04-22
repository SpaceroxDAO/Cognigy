import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { adminService } from '@/services/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Search, FileText, User, Monitor, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DemoLog {
  id: string;
  user_id: string;
  flow_id: string;
  flow_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  metadata: any;
}

export const AdminDemoLogs: React.FC = () => {
  const [logs, setLogs] = useState<DemoLog[]>([]);
  const [userEmailMap, setUserEmailMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, users] = await Promise.all([
        supabase.from('demo_logs').select('*').order('started_at', { ascending: false }).limit(200),
        adminService.listUsers(),
      ]);
      if (logsRes.error) throw logsRes.error;
      setLogs(logsRes.data || []);
      const emailMap: Record<string, string> = {};
      users.forEach(u => { emailMap[u.id] = u.email; });
      setUserEmailMap(emailMap);
    } catch {
      toast.error('Failed to load demo logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const filtered = logs.filter(log =>
    !searchTerm ||
    log.flow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.flow_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-slate-900">Demo Audit Logs</h3>
          <Badge variant="secondary">{logs.length} entries</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search by flow name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Calendar className="w-4 h-4 inline mr-1" />Started</TableHead>
                <TableHead><Monitor className="w-4 h-4 inline mr-1" />Flow</TableHead>
                <TableHead><User className="w-4 h-4 inline mr-1" />User ID</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500">No logs found</TableCell></TableRow>
              ) : filtered.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{format(new Date(log.started_at), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{log.flow_name}</Badge>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs text-slate-600">{userEmailMap[log.user_id] || <span className="font-mono text-slate-400">{log.user_id.slice(0, 8)}...</span>}</span></TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {log.duration_seconds != null ? `${log.duration_seconds}s` : log.ended_at ? `${Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s` : '—'}
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
