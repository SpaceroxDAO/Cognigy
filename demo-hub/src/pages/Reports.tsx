import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { adminService } from '@/services/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Loading from '@/components/ui/loading';
import { toast } from 'sonner';
import { BarChart3, RefreshCw, Loader2, Search, Users, Clock, TrendingUp, Activity, FileText } from 'lucide-react';
import { exportReportPdf } from '@/utils/exportPdf';
import { format, subDays, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';

interface DemoLog {
  id: string;
  user_id: string;
  flow_id: string;
  flow_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

const CHART_COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)', 'hsl(271, 91%, 65%)', 'hsl(174, 100%, 47%)',
  'hsl(316, 72%, 52%)', 'hsl(200, 98%, 39%)',
];

const Reports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, hasRole } = useAuth();
  const [logs, setLogs] = useState<DemoLog[]>([]);
  const [userEmailMap, setUserEmailMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [exportingPdf, setExportingPdf] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportReportPdf({
        sections: [summaryRef.current, chartsRef.current, barChartRef.current, tableRef.current],
        title: 'Demo Reports',
        dateRange,
      });
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const hasAccess = isAdmin || hasRole('sales-manager');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
    if (!authLoading && user && !hasAccess) navigate('/', { replace: true });
  }, [user, authLoading, hasAccess, navigate]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [logsRes, users] = await Promise.all([
        supabase.from('demo_logs').select('id, user_id, flow_id, flow_name, started_at, ended_at, duration_seconds')
          .order('started_at', { ascending: false }).limit(1000),
        adminService.listUsers().catch(() => []),
      ]);
      if (logsRes.error) throw logsRes.error;
      setLogs(logsRes.data || []);
      const emailMap: Record<string, string> = {};
      users.forEach(u => { emailMap[u.id] = u.email; });
      setUserEmailMap(emailMap);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && hasAccess) loadData();
  }, [user, hasAccess, loadData]);

  // Filter by date range and search
  const cutoff = startOfDay(subDays(new Date(), parseInt(dateRange)));
  const filtered = logs.filter(log => {
    const logDate = parseISO(log.started_at);
    if (logDate < cutoff) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const email = userEmailMap[log.user_id] || '';
      return log.flow_name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
    }
    return true;
  });

  // Summary stats
  const totalSessions = filtered.length;
  const uniqueUsers = new Set(filtered.map(l => l.user_id)).size;
  const avgDuration = filtered.filter(l => l.duration_seconds != null).reduce((sum, l) => sum + (l.duration_seconds || 0), 0) / (filtered.filter(l => l.duration_seconds != null).length || 1);
  const uniqueDemos = new Set(filtered.map(l => l.flow_name)).size;

  // Most popular demos (pie chart)
  const demoCounts: Record<string, number> = {};
  filtered.forEach(l => { demoCounts[l.flow_name] = (demoCounts[l.flow_name] || 0) + 1; });
  const popularDemos = Object.entries(demoCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Usage over time (line chart) - group by day
  const dailyCounts: Record<string, number> = {};
  filtered.forEach(l => {
    const day = format(parseISO(l.started_at), 'MMM d');
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const timeSeriesData = Object.entries(dailyCounts)
    .map(([date, sessions]) => ({ date, sessions }))
    .reverse();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <Loading variant="fullscreen" size="xl" text="Loading reports..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navigation />
      <div className="pt-28 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">Demo Reports</h1>
                <p className="text-slate-500 text-sm">Usage analytics and performance insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={loading || exportingPdf || filtered.length === 0} className="rounded-xl">
                {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />} PDF
              </Button>
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div ref={summaryRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-slate-200/60 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Total Sessions</p>
                        <p className="text-3xl font-black text-slate-900">{totalSessions}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-200/60 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Unique Users</p>
                        <p className="text-3xl font-black text-slate-900">{uniqueUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-200/60 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Avg Duration</p>
                        <p className="text-3xl font-black text-slate-900">{Math.round(avgDuration)}s</p>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-200/60 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Active Demos</p>
                        <p className="text-3xl font-black text-slate-900">{uniqueDemos}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Popular Demos */}
                <Card className="rounded-2xl border-slate-200/60 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900">Most Popular Demos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {popularDemos.length === 0 ? (
                      <p className="text-center text-slate-400 py-8">No data available</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={popularDemos}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {popularDemos.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Usage Over Time */}
                <Card className="rounded-2xl border-slate-200/60 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900">Usage Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timeSeriesData.length === 0 ? (
                      <p className="text-center text-slate-400 py-8">No data available</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                          <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                          <Tooltip />
                          <Line type="monotone" dataKey="sessions" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Demo Breakdown Bar Chart */}
              <div ref={barChartRef}>
              <Card className="rounded-2xl border-slate-200/60 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Sessions by Demo</CardTitle>
                </CardHeader>
                <CardContent>
                  {popularDemos.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">No data available</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={popularDemos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              </div>

              {/* User Activity Table */}
              <div ref={tableRef}>
              <Card className="rounded-2xl border-slate-200/60 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900">User Activity Log</CardTitle>
                    <Badge variant="secondary">{filtered.length} sessions</Badge>
                  </div>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input className="pl-9 rounded-xl" placeholder="Search by demo or user..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Demo</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-slate-500">No sessions found</TableCell>
                          </TableRow>
                        ) : filtered.slice(0, 100).map(log => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                              {format(parseISO(log.started_at), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{log.flow_name}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {userEmailMap[log.user_id] || log.user_id.slice(0, 8) + '...'}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {log.duration_seconds != null
                                ? `${log.duration_seconds}s`
                                : log.ended_at
                                  ? `${Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s`
                                  : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filtered.length > 100 && (
                    <p className="text-center text-xs text-slate-400 mt-3">Showing first 100 of {filtered.length} sessions</p>
                  )}
                </CardContent>
              </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
