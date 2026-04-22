import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuthEvents, AuthEvent, AuthEventType } from '@/services/authEvents';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, ChevronLeft, ChevronRight, Shield, AlertTriangle, LogIn, LogOut, KeyRound, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EVENT_TYPE_CONFIG: Record<AuthEventType, { label: string; color: string; icon: React.ElementType }> = {
  login_success: { label: 'Login Success', color: 'bg-green-100 text-green-800 border-green-200', icon: LogIn },
  login_failure: { label: 'Login Failure', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  logout: { label: 'Logout', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: LogOut },
  password_reset_request: { label: 'Password Reset Request', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: KeyRound },
  password_reset_complete: { label: 'Password Reset Complete', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: KeyRound },
  security_challenge_success: { label: 'Security Challenge OK', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Shield },
  security_challenge_failure: { label: 'Security Challenge Fail', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  account_locked: { label: 'Account Locked', color: 'bg-red-200 text-red-900 border-red-300', icon: Lock },
};

const PAGE_SIZE = 25;

export const AdminAccessLogs: React.FC = () => {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, count } = await fetchAuthEvents({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        eventType: filterType !== 'all' ? (filterType as AuthEventType) : undefined,
        email: searchEmail || undefined,
      });
      setEvents(data);
      setTotal(count);
    } catch (e: any) {
      toast.error('Failed to load access logs: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, searchEmail]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadEvents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Access Logs</h2>
          <p className="text-sm text-slate-500">Authentication events and security audit trail</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadEvents} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(0); }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All event types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Events" value={total} />
        <StatCard label="Page" value={`${page + 1} / ${Math.max(1, totalPages)}`} />
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Time</TableHead>
              <TableHead className="font-semibold">Event</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                  No access logs found
                </TableCell>
              </TableRow>
            )}
            {events.map((event) => {
              const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.login_success;
              const Icon = config.icon;
              return (
                <TableRow key={event.id}>
                  <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                    {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${config.color} text-xs font-medium gap-1`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{event.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-slate-500 max-w-[200px] truncate">
                    {event.metadata && Object.keys(event.metadata).length > 0
                      ? JSON.stringify(event.metadata)
                      : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{total} total events</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
    <p className="text-xs text-slate-500 font-medium">{label}</p>
    <p className="text-lg font-bold text-slate-900">{value}</p>
  </div>
);
